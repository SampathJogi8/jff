# Ensure non-GUI matplotlib backend *before* importing pyplot
import os
os.environ.setdefault('MPLBACKEND', 'Agg')
# Optionally try to use 'fork' start method to avoid resource_tracker semaphore warnings.
# On macOS Python default is 'spawn' which can sometimes produce the leaked semaphore warnings.
import multiprocessing as mp
try:
    mp.set_start_method('fork')   # best-effort; will raise RuntimeError if start method already set
except RuntimeError:
    pass
from flask import Flask, request, render_template, redirect, url_for, jsonify, send_file
import time, os
from state_store import StateStore
from dfa import AdaptiveDFAService
import db

app = Flask(__name__)
db.init_db()
store = StateStore(persist=False)

# Config
DEFAULT_THRESHOLD = 3
TIME_WINDOW = 60
EMAIL_ENABLED = True  # ready; configure EMAIL_CONFIG below
EMAIL_CONFIG = {
    'sender': 'sender@gmail.com',
    'receiver': 'receiver@gmail.com',
    'app_password': 'aaaa',
    'smtp_server': 'smtp.gmail.com',
    'smtp_port': 465
}
BLOCK_DURATION = 120

dfa = AdaptiveDFAService(default_threshold=DEFAULT_THRESHOLD, time_window=TIME_WINDOW, email_enabled=EMAIL_ENABLED, store=store)

# Demo credentials
USER_CREDENTIALS = {'admin':'12345', 'user1':'password1'}

def get_client_ip():
    return request.remote_addr or request.environ.get('HTTP_X_FORWARDED_FOR','unknown')

def is_blocked(ip):
    return store.is_blocked(ip)

@app.route('/')
def index():
    ip = get_client_ip()
    blocked = store.is_blocked(ip)
    rem = store.get_block_remaining(ip) if blocked else 0
    return render_template('index.html', blocked=blocked, rem=rem)

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username','').strip()
    password = request.form.get('password','').strip()
    ip = get_client_ip()
    # enforce captcha if blocked
    if store.is_blocked(ip):
        return render_template('blocked.html', ip=ip, rem=store.get_block_remaining(ip))
    success = USER_CREDENTIALS.get(username) == password
    state, message, captcha_required = dfa.process_attempt(username, success, ip=ip, email_config=EMAIL_CONFIG if EMAIL_ENABLED else None)
    css_class = 'success' if success else ('alert' if state=='ALERT' else 'fail')
    t = int(time.time())
    db.insert_attempt(t, username, ip, 'Success' if success else 'Fail', state)
    if state == 'ALERT':
        unblock_at = int(time.time()) + BLOCK_DURATION
        store.block_ip(ip, unblock_at)
        return redirect(url_for('captcha', username=username))
    return render_template('index.html', result=message, state=state, css_class=css_class, blocked=False, rem=0)

@app.route('/captcha', methods=['GET','POST'])
def captcha():
    username = request.args.get('username','')
    ip = get_client_ip()
    if request.method == 'POST':
        answer = request.form.get('captcha_answer','').strip().lower()
        if answer == 'human':
            # reset user's DFA and unblock IP
            dfa.reset_user(username)
            store.unblock_ip(ip)
            return render_template('index.html', result='✅ CAPTCHA passed. You may try login.', state='START', css_class='success', blocked=False, rem=0)
        else:
            return render_template('captcha.html', username=username, error='Wrong answer. Type the shown word exactly.')
    return render_template('captcha.html', username=username)

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    username = data.get('username','').strip()
    password = data.get('password','').strip()
    ip = request.remote_addr or data.get('ip','unknown')
    if store.is_blocked(ip):
        return jsonify({'status':'blocked','message':'IP temporarily blocked','ip':ip}), 403
    success = USER_CREDENTIALS.get(username) == password
    state, message, captcha_required = dfa.process_attempt(username, success, ip=ip, email_config=EMAIL_CONFIG if EMAIL_ENABLED else None)
    t = int(time.time())
    db.insert_attempt(t, username, ip, 'Success' if success else 'Fail', state)
    if state == 'ALERT':
        unblock_at = int(time.time()) + BLOCK_DURATION
        store.block_ip(ip, unblock_at)
        return jsonify({'status':'alert','message':message,'state':state,'captcha_required':True}), 200
    return jsonify({'status':'ok' if success else 'failed','message':message,'state':state,'captcha_required':captcha_required}), 200

@app.route('/stats.png')
def stats_png():
    import matplotlib.pyplot as plt, io
    username = request.args.get('username')
    rows = db.fetch_attempts(limit=500, username=username)
    if not rows:
        fig = plt.figure(figsize=(6,3))
        plt.text(0.5,0.5,'No data yet', ha='center', va='center')
        out = io.BytesIO()
        fig.savefig(out, format='png')
        plt.close(fig)
        return app.response_class(out.getvalue(), mimetype='image/png')

    state_levels = {'START':0,'FAIL1':1,'FAIL2':2,'FAIL3':3,'ALERT':4}
    xs = list(range(1, len(rows)+1))
    ys = [state_levels.get(r[5], 0) for r in reversed(rows)]
    labels = [r[2] for r in reversed(rows)]  # usernames for all users

    fig, ax = plt.subplots(figsize=(8,4.5))
    ax.plot(xs, ys, marker='o')
    ax.set_yticks([0,1,2,3,4])
    ax.set_yticklabels(['START','FAIL1','FAIL2','FAIL3','ALERT'])
    ax.set_xlabel('Attempt Number (latest → oldest)')
    ax.set_ylabel('DFA State')
    ax.set_title('DFA State Transitions' + (f" (user={username})" if username else " (all users)"))
    ax.grid(True, linestyle='--', linewidth=0.5)

    # Show usernames every few points for context if "all users"
    if not username and len(xs) > 1:
        for i, x in enumerate(xs):
            if i % max(1, len(xs)//10) == 0:
                ax.annotate(labels[i], (x, ys[i]), textcoords="offset points", xytext=(0,10), ha='center', fontsize=8)

    out = io.BytesIO()
    fig.savefig(out, format='png')
    plt.close(fig)
    return app.response_class(out.getvalue(), mimetype='image/png')


@app.route('/admin')
def admin():
    username = request.args.get('username')
    rows = db.fetch_attempts(limit=1000, username=username)
    formatted = [ (r[0], time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(r[1])), r[2], r[3], r[4], r[5]) for r in rows ]
    # gather simple stats
    total = len(formatted)
    succ = sum(1 for r in formatted if r[4]=='Success')
    fail = sum(1 for r in formatted if r[4]=='Fail')
    active_users = [(k,v) for k,v in store.list_users()]
    return render_template('admin.html', rows=formatted, username=username, total=total, succ=succ, fail=fail, active_users=active_users)

@app.route('/reset-db')
def reset_db():
    # clear attempts and blocks and in-memory store
    db.clear_attempts()
    store.clear_all()
    return redirect(url_for('admin'))

@app.route('/download-db')
def download_db():
    path = os.path.join(os.path.dirname(__file__), 'attempts.db')
    if os.path.exists(path):
        return send_file(path, as_attachment=True)
    return 'DB not found', 404


@app.route('/stats-data')
def stats_data():
    from flask import jsonify
    username = request.args.get('username')
    rows = db.fetch_attempts(limit=10000, username=username)
    total = len(rows)
    succ = sum(1 for r in rows if r[4] == 'Success')
    fail = sum(1 for r in rows if r[4] == 'Fail')
    return jsonify({'total': total, 'succ': succ, 'fail': fail})

if __name__ == '__main__':
    app.run(debug=True)

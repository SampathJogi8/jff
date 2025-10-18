import time
from state_store import StateStore

class UserDFA:
    def __init__(self, threshold=3, time_window=60):
        self.threshold = threshold
        self.time_window = time_window
        self.fail_timestamps = []
        self.state = 'START'
        self.captcha_required = False

    def to_dict(self):
        return {'threshold': self.threshold, 'time_window': self.time_window,
                'fail_timestamps': self.fail_timestamps, 'state': self.state,
                'captcha_required': self.captcha_required}

    @classmethod
    def from_dict(cls, d):
        u = cls(threshold=d.get('threshold',3), time_window=d.get('time_window',60))
        u.fail_timestamps = d.get('fail_timestamps',[])
        u.state = d.get('state','START')
        u.captcha_required = d.get('captcha_required', False)
        return u

    def reset(self):
        self.fail_timestamps = []
        self.state = 'START'
        self.captcha_required = False

    def process_fail(self):
        now = time.time()
        self.fail_timestamps.append(now)
        self.fail_timestamps = [t for t in self.fail_timestamps if now - t <= self.time_window]
        if len(self.fail_timestamps) >= self.threshold:
            self.state = 'ALERT'
            self.captcha_required = True
        else:
            self.state = f'FAIL{len(self.fail_timestamps)}'
        return self.state

class AdaptiveDFAService:
    def __init__(self, default_threshold=3, time_window=60, email_enabled=False, store=None):
        self.default_threshold = default_threshold
        self.time_window = time_window
        self.email_enabled = email_enabled
        self.store = store or StateStore(persist=False)

    def _load_user(self, username):
        raw = self.store.get_user(username)
        if raw:
            return UserDFA.from_dict(raw)
        u = UserDFA(threshold=self.default_threshold, time_window=self.time_window)
        return u

    def _save_user(self, username, userdfa):
        self.store.set_user(username, userdfa.to_dict())

    def _ensure_user(self, username):
        return self._load_user(username)

    def get_effective_threshold(self, username, ip=None):
        th = self.default_threshold
        profile = self.store.get_ip_profile(ip) if ip else 'normal'
        if profile == 'trusted':
            th += 1
        if profile == 'suspicious':
            th = max(1, th-1)
        return th

    def process_attempt(self, username, success: bool, ip=None, email_config=None):
        user = self._load_user(username)
        user.threshold = self.get_effective_threshold(username, ip)
        if success:
            user.reset()
            self._save_user(username, user)
            return user.state, '✅ Login Successful! DFA Reset.', False
        state = user.process_fail()
        self._save_user(username, user)
        if state == 'ALERT' and self.email_enabled and email_config:
            try:
                self.send_email_alert(email_config, username, state, ip)
            except Exception as e:
                print('Email send error:', e)
        return state, ('🚨 ALERT! Brute-force detected for user: {}'.format(username)) if state=='ALERT' else f'❌ Failed -> {state}', user.captcha_required

    def reset_user(self, username):
        self.store.del_user(username)

    def list_active_users(self):
        return list(self.store.list_users())

    def send_email_alert(self, email_config, username, state, ip):
        import smtplib
        from email.mime.text import MIMEText
        sender = email_config.get('sender')
        receiver = email_config.get('receiver')
        app_password = email_config.get('app_password')
        smtp_server = email_config.get('smtp_server','smtp.gmail.com')
        smtp_port = int(email_config.get('smtp_port',465))
        subject = f'Security Alert: Brute-force detected for user {username} (ip={ip})'
        body = f"User '{username}' has triggered DFA state '{state}' due to multiple failed login attempts within time window from IP {ip}."
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = sender
        msg['To'] = receiver
        with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
            server.login(sender, app_password)
            server.sendmail(sender, [receiver], msg.as_string())

import sqlite3, time
from pathlib import Path
DB_PATH = Path(__file__).parent / 'attempts.db'

def init_db():
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("""CREATE TABLE IF NOT EXISTS attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        t INTEGER,
        username TEXT,
        ip TEXT,
        result TEXT,
        state TEXT
    )""")
    con.commit()
    con.close()

def insert_attempt(t, username, ip, result, state):
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute('INSERT INTO attempts (t, username, ip, result, state) VALUES (?,?,?,?,?)', (t, username, ip, result, state))
    con.commit()
    con.close()

def fetch_attempts(limit=500, username=None):
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    if username:
        cur.execute('SELECT id,t,username,ip,result,state FROM attempts WHERE username=? ORDER BY id DESC LIMIT ?', (username, limit))
    else:
        cur.execute('SELECT id,t,username,ip,result,state FROM attempts ORDER BY id DESC LIMIT ?', (limit,))
    rows = cur.fetchall()
    con.close()
    return rows

def clear_attempts():
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute('DELETE FROM attempts')
    con.commit()
    con.close()

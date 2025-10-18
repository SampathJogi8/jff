import time, json, os
_STORE_PATH = os.path.join(os.path.dirname(__file__), 'state_store.json')

class StateStore:
    def __init__(self, persist=False):
        self.persist = persist
        self._data = {
            'user_states': {},   # username -> dict(state, fail_timestamps list)
            'ip_blocks': {},     # ip -> unblock_at
            'ip_profiles': {}    # ip -> reputation: trusted/suspicious/normal
        }
        if persist and os.path.exists(_STORE_PATH):
            try:
                with open(_STORE_PATH, 'r') as f:
                    self._data = json.load(f)
            except Exception:
                pass

    def save(self):
        if not self.persist: return
        try:
            with open(_STORE_PATH, 'w') as f:
                json.dump(self._data, f)
        except Exception:
            pass

    # user state methods
    def get_user(self, username):
        return self._data['user_states'].get(username)

    def set_user(self, username, value):
        self._data['user_states'][username] = value
        self.save()

    def del_user(self, username):
        if username in self._data['user_states']:
            del self._data['user_states'][username]
            self.save()

    def list_users(self):
        return self._data['user_states'].items()

    # ip block methods
    def block_ip(self, ip, unblock_at):
        self._data['ip_blocks'][ip] = unblock_at
        self.save()

    def is_blocked(self, ip):
        unblock_at = self._data['ip_blocks'].get(ip)
        if not unblock_at: return False
        if time.time() > unblock_at:
            # expired -> remove
            try:
                del self._data['ip_blocks'][ip]
                self.save()
            except KeyError:
                pass
            return False
        return True

    def unblock_ip(self, ip):
        if ip in self._data['ip_blocks']:
            del self._data['ip_blocks'][ip]
            self.save()

    def get_block_remaining(self, ip):
        unblock_at = self._data['ip_blocks'].get(ip)
        if not unblock_at: return 0
        rem = int(unblock_at - time.time())
        return rem if rem>0 else 0

    # ip profiles
    def set_ip_profile(self, ip, profile):
        self._data['ip_profiles'][ip] = profile
        self.save()

    def get_ip_profile(self, ip):
        return self._data['ip_profiles'].get(ip, 'normal')

    def clear_all(self):
        self._data['user_states'] = {}
        self._data['ip_blocks'] = {}
        self._data['ip_profiles'] = {}
        self.save()

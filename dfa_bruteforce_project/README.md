DFA Brute-force Detection (v7 rebuilt)

Features:
- Simulated Redis (state_store.py) for scalable state management
- Adaptive thresholds per IP profile (trusted/suspicious)
- CAPTCHA enforcement and IP blocking with remaining timer display
- REST API for microservice integration
- Admin page with stats and Reset Logs button
- Improved UI for professional demo

Run:
1. python -m venv venv
2. source venv/bin/activate   (Windows: venv\Scripts\activate)
3. pip install -r requirements.txt
4. python app.py
5. Open http://127.0.0.1:5000/

To enable email alerts: edit EMAIL_CONFIG in app.py and set EMAIL_ENABLED=True

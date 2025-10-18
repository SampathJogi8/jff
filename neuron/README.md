# 🧠 Parkinson Detection Technology

A simple web-based tool that simulates **early Parkinson’s disease detection** using **keystroke dynamics analysis**.  
This demo analyzes **typing speed, dwell time, and flight time** to estimate potential risk levels — providing a non-invasive approach to early detection.

---

## 🚀 Features

- **Live Keystroke Analysis:** Records user typing in real-time.  
- **Instant Risk Evaluation:** Calculates low, medium, or high risk based on keystroke dwell times.  
- **Interactive UI:** Clean, responsive interface with visual feedback.  
- **Non-Invasive Test:** No personal data collection — analysis runs locally in the browser.  

---

## 🧩 Project Structure

```
📁 Parkinson-Detection-Technology
│
├── index.html      # Main interface for the web app
├── style.css       # Styling for layout, buttons, and themes
└── script.js       # Core logic for recording and analyzing keystrokes
```

---

## 🖥️ How to Run

1. **Download or clone** the repository.
2. Open the folder in your code editor or file explorer.
3. Simply **open `index.html`** in any modern web browser (Chrome, Edge, Firefox, etc.).
4. Click **"Start Analysis"** and begin typing in the input box.
5. Click **"Stop & Analyze"** to view your keystroke-based risk score.

---

## ⚙️ Technology Used

- **HTML5** — Structure and layout.  
- **CSS3** — Styling and responsive design.  
- **JavaScript (Vanilla)** — Real-time event handling, keystroke tracking, and risk computation.  
- **Google Fonts (Inter)** — Modern, clean typography.  

---

## 📊 Risk Scoring Logic

The app measures **average dwell time** (key press duration):

| Average Dwell Time (ms) | Risk Level |
|--------------------------|-------------|
| ≤ 200                    | Low         |
| 201–400                  | Medium      |
| > 400                    | High        |

*(For demonstration only — not medically validated.)*

---

## 🔒 Privacy

All analysis runs locally in your browser.  
No keystroke data is sent or stored externally.  

---

## 🧪 Future Enhancements

- Integrate **machine learning models** for pattern-based classification.  
- Support **cloud-based logging** and medical research datasets.  
- Add **voice tremor and motion tracking** for multi-modal analysis.  

---

## 👨‍💻 Author

**KeyTrace Health Team**  
© 2025 All Rights Reserved  

let recording = false;
let log = [];
let lastReleaseTime = null;

const typingArea = document.getElementById("typingArea");
const statusText = document.getElementById("statusText");
const keystrokeCount = document.getElementById("keystrokeCount");
const riskScore = document.getElementById("riskScore");

function startRecording() {
  recording = true;
  log = [];
  lastReleaseTime = null;
  statusText.textContent = "Recording...";
  keystrokeCount.textContent = "0 keystrokes captured";
  riskScore.textContent = "Recording in progress...";
  riskScore.className = "pending";
}

function stopAndAnalyze() {
  recording = false;
  statusText.textContent = "Recording stopped";
  keystrokeCount.textContent = `${log.length} keystrokes captured`;

  const avgDwell = log.filter(e => e.dwell).reduce((sum, e) => sum + e.dwell, 0) / log.length;
  let risk = "low";
  if (avgDwell > 200) risk = "medium";
  if (avgDwell > 400) risk = "high";

  riskScore.textContent = `Risk Score: ${risk.toUpperCase()}`;
  riskScore.className = risk;
}

typingArea.addEventListener("keydown", (e) => {
  if (!recording) return;
  const time = Date.now();
  const flightTime = lastReleaseTime ? time - lastReleaseTime : null;

  log.push({
    key: e.key,
    event: "keydown",
    time: time,
    dwell: null,
    flight: flightTime
  });

  keystrokeCount.textContent = `${log.length} keystrokes captured`;
});

typingArea.addEventListener("keyup", (e) => {
  if (!recording) return;
  const time = Date.now();
  const lastKeydown = [...log].reverse().find(entry =>
    entry.key === e.key && entry.event === "keydown" && entry.dwell === null
  );

  if (lastKeydown) {
    const dwellTime = time - lastKeydown.time;
    lastKeydown.dwell = dwellTime;
    lastReleaseTime = time;
  }
});
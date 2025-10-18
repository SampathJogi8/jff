// Health Mirror 360 — app logic (no external AI; rule-based engine)
const sleepInput = document.getElementById('sleep');
const waterInput = document.getElementById('water');
const stepsInput = document.getElementById('steps');
const mealsInput = document.getElementById('meals');
const moodInput = document.getElementById('mood');
const dietNotesInput = document.getElementById('dietNotes');

const calcBtn = document.getElementById('calcBtn');
const resetBtn = document.getElementById('resetBtn');

const scoreCircle = document.getElementById('scoreCircle');
const scoreHeader = document.getElementById('scoreHeader');
const scoreDesc = document.getElementById('scoreDesc');
const tipsContainer = document.getElementById('tipsContainer');
const tipSummary = document.getElementById('tipSummary');

const xpEl = document.getElementById('xp');
const levelEl = document.getElementById('level');
const badgesEl = document.getElementById('badges');

let userState = {
  xp: 0,
  level: 1,
  badges: []
};

// Compute daily health score (0-100) using simple heuristics
function computeScore(data){
  // normalize components to 0-100, then weighted sum
  let sleepScore = Math.max(0, Math.min(100, (data.sleep / 8) * 100));
  let waterScore = Math.max(0, Math.min(100, (data.water / 2000) * 100));
  let stepsScore = Math.max(0, Math.min(100, (data.steps / 8000) * 100));
  let mealsScore = Math.max(0, Math.min(100, (data.meals / 5) * 100));
  let moodScore = ((data.mood - 1) / 4) * 100; // 1-5 -> 0-100

  // diet penalty if notes mention "skip" or "late" or "junk"
  let dietPenalty = 0;
  const notes = data.notes.toLowerCase();
  if(/skip|skipped|late|junk|fried|sugary|soda/.test(notes)) dietPenalty = 10;

  // weights
  let total = sleepScore * 0.22 + waterScore * 0.18 + stepsScore * 0.18 + mealsScore * 0.2 + moodScore * 0.18;
  total = Math.round(total - dietPenalty);
  total = Math.max(0, Math.min(100, total));
  return {
    value: total,
    components: {sleepScore, waterScore, stepsScore, mealsScore, moodScore, dietPenalty}
  };
}

// Generate 1-3 actionable tips
function generateTips(data, score){
  const tips = [];
  if(data.water < 2000) tips.push({id:'water','emoji':'💧','text':'Drink more water (aim 2000ml+)'});
  if(data.steps < 8000) tips.push({id:'steps','emoji':'🚶‍♂️','text':'Take a short walk — add 2000 steps'});
  if(data.sleep < 7) tips.push({id:'sleep','emoji':'😴','text':'Try to get 7–8 hours of sleep'});
  if(data.meals < 3) tips.push({id:'meals','emoji':'🥗','text':'Include a balanced meal or healthy snack'});
  if(/skip|late/.test(data.notes.toLowerCase())) tips.push({id:'routine','emoji':'⏰','text':'Stabilize meal & sleep routine'});
  if(data.mood < 3) tips.push({id:'mood','emoji':'🧘','text':'Try 5 minutes of breathing or a short break'});

  // prefer short list: pick top 3 by importance (simple priority order)
  const priority = ['sleep','water','steps','meals','routine','mood'];
  tips.sort((a,b)=>priority.indexOf(a.id)-priority.indexOf(b.id));
  return tips.slice(0,3);
}

function applyVisuals(score){
  scoreCircle.textContent = score;
  scoreCircle.style.borderColor = 'rgba(255,255,255,0.06)';
  if(score >= 75){
    scoreCircle.style.background = 'linear-gradient(180deg,#e6fff0,transparent)';
    scoreCircle.style.color = '#052b16';
    scoreDesc.textContent = 'Great work — keep it up! 🎉';
  } else if(score >= 50){
    scoreCircle.style.background = 'linear-gradient(180deg,#fff7e6,transparent)';
    scoreCircle.style.color = '#3a2b05';
    scoreDesc.textContent = 'Not bad — a few small changes can help.';
  } else {
    scoreCircle.style.background = 'linear-gradient(180deg,#ffefef,transparent)';
    scoreCircle.style.color = '#360606';
    scoreDesc.textContent = 'Needs improvement — try these targeted tips.';
  }
}

function renderTips(tips, score){
  tipsContainer.innerHTML = '';
  if(tips.length === 0){
    tipsContainer.innerHTML = '<div class="tip">🎉 No tips — you nailed it! Keep the momentum.</div>';
    tipSummary.textContent = '';
    return;
  }
  tipSummary.textContent = `Score ${score} → ${tips.map(t=>t.text.split(' (')[0]).join(', ')}.`;
  tips.forEach(t=>{
    const el = document.createElement('div');
    el.className = 'tip';
    el.innerHTML = `
      <div class="left">
        <div class="emoji">${t.emoji}</div>
        <div class="desc"><strong>${t.text}</strong><div class="muted">${shortExplain(t.id)}</div></div>
      </div>
      <div class="actions">
        <button class="doneBtn" data-id="${t.id}">Mark done</button>
      </div>
    `;
    tipsContainer.appendChild(el);
  });

  // attach listeners
  document.querySelectorAll('.doneBtn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const id = btn.dataset.id;
      // reward XP & slightly boost score simulate improvement
      userState.xp += 10;
      if(userState.xp >= 100){ userState.level += 1; userState.xp -= 100; userState.badges.push('Consistent'); }
      xpEl.textContent = userState.xp;
      levelEl.textContent = userState.level;
      renderBadges();
      btn.textContent = 'Completed ✓';
      btn.disabled = true;
      // small animation
      btn.style.transform = 'scale(0.98)';
      setTimeout(()=>btn.style.transform = '', 200);
      // visual boost
      let cur = parseInt(scoreCircle.textContent) || 0;
      cur = Math.min(100, cur + 5);
      applyVisuals(cur);
    });
  });
}

function shortExplain(id){
  const map = {
    water: 'Hydration supports energy & concentration.',
    steps: 'Extra movement improves mood and circulation.',
    sleep: 'Adequate sleep helps recovery and cognition.',
    meals: 'Balanced meals stabilize blood sugar.',
    routine: 'Regular routines support consistency.',
    mood: 'Micro-breaks calm the nervous system.'
  };
  return map[id] || '';
}

// Weekly chart (simulated trend with color)
let weekChart;
function renderWeekChart(todayScore){
  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  // simulate: fill previous with slight variance around today
  const data = labels.map((l,i)=>{
    const base = todayScore !== null ? todayScore : 65;
    const jitter = (Math.sin(i*1.3)+1)*6 - 6; // -6..6
    return Math.max(10, Math.min(100, Math.round(base + jitter + (i-3)*2)));
  });

  const colors = data.map(v => v>=75 ? '#32d583' : (v>=50 ? '#ffb86b' : '#ff6b6b'));

  const ctx = document.getElementById('weekChart').getContext('2d');
  if(weekChart) weekChart.destroy();
  weekChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Wellness score',
        data,
        backgroundColor: colors,
        borderRadius:6
      }]
    },
    options: {
      responsive:true,
      plugins:{legend:{display:false}},
      scales:{
        y:{min:0,max:100,ticks:{stepSize:25}}
      }
    }
  });
}

// badges rendering
function renderBadges(){
  badgesEl.innerHTML = '';
  userState.badges.forEach(b=>{
    const el = document.createElement('div');
    el.className = 'badge';
    el.textContent = b;
    badgesEl.appendChild(el);
  });
}

// handlers
calcBtn.addEventListener('click', ()=>{
  const data = {
    sleep: parseFloat(sleepInput.value || 0),
    water: parseFloat(waterInput.value || 0),
    steps: parseInt(stepsInput.value || 0,10),
    meals: parseInt(mealsInput.value || 0,10),
    mood: parseInt(moodInput.value || 3,10),
    notes: dietNotesInput.value || ''
  };
  const result = computeScore(data);
  const score = result.value;
  applyVisuals(score);
  const tips = generateTips(data, score);
  renderTips(tips, score);
  renderWeekChart(score);
});

resetBtn.addEventListener('click', ()=>{
  sleepInput.value='7'; waterInput.value='1500'; stepsInput.value='5000';
  mealsInput.value='3'; moodInput.value='3'; dietNotesInput.value='';
  scoreCircle.textContent='—';
  scoreDesc.textContent='Enter data and press Calculate.';
  tipsContainer.innerHTML=''; tipSummary.textContent='';
  renderWeekChart(null);
});

// init
renderWeekChart(65);
xpEl.textContent = userState.xp;
levelEl.textContent = userState.level;
renderBadges();

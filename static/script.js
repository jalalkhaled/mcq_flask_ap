// static/script.js

// Total quiz time in seconds (5 minutes)
const TOTAL_TIME = 30 * 60;

// Keys for storage
const STORAGE_TIME_KEY = 'mcq_time_left';
const STORAGE_ANSWERS_KEY = 'mcq_answers';

// Try to load saved state or fallback to start values
let timeLeft = parseInt(localStorage.getItem(STORAGE_TIME_KEY), 10);
if (isNaN(timeLeft) || timeLeft < 0) {
  timeLeft = TOTAL_TIME;
}

// Load saved answers or start fresh
let saved = localStorage.getItem(STORAGE_ANSWERS_KEY);
let answers = saved ? JSON.parse(saved) : {};

let timerInterval;

window.onload = () => {
  // Pre-fill name if stored (optional)
  const storedName = localStorage.getItem('mcq_name');
  if (storedName) document.getElementById('studentName').value = storedName;
  
  renderQuestions();
  startTimer();
};

// Renders the questions and restores checked radios
function renderQuestions() {
  const qContainer = document.getElementById('questions');
  QUESTIONS.forEach(q => {
    const div = document.createElement('div');
    div.className = 'question';
    div.innerHTML = `
      <p>${q.id}. ${q.text}</p>
      <div class="options">
        ${q.options.map((opt, idx) => {
          const checked = answers[q.id] === idx ? 'checked' : '';
          return `<label>
                    <input type="radio" name="q${q.id}" value="${idx}" ${checked}>
                    ${opt}
                  </label>`;
        }).join('')}
      </div>
    `;
    qContainer.appendChild(div);
  });
  
  // Re-bind event listeners to each radio to save when changed
  document.querySelectorAll('.options input[type=radio]')
    .forEach(input => input.addEventListener('change', onAnswerSelected));
  
  document.getElementById('submitBtn').onclick = submitQuiz;
}

// Called whenever a radio button is clicked
function onAnswerSelected(e) {
  const [, qid] = e.target.name.match(/^q(\d+)$/);
  answers[qid] = parseInt(e.target.value, 10);
  localStorage.setItem(STORAGE_ANSWERS_KEY, JSON.stringify(answers));
}

// Timer logic (same, but also saves)
function startTimer() {
  updateDisplay();
  timerInterval = setInterval(() => {
    timeLeft--;
    localStorage.setItem(STORAGE_TIME_KEY, timeLeft);
    updateDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitQuiz();
    }
  }, 1000);
}

function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  document.getElementById('time').innerText =
    `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Submit and clear storage
function submitQuiz() {
  clearInterval(timerInterval);
  
  const name = document.getElementById('studentName').value.trim();
  if (!name) {
    alert('Please enter your name');
    return;
  }
  
  // Save name too (optional)
  localStorage.setItem('mcq_name', name);
  
  fetch('/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        answers,
        timestamp: new Date().toISOString()
      })
    })
    .then(res => res.json())
    .then(data => {
      // Clear stored quiz state on successful redirect
      localStorage.removeItem(STORAGE_TIME_KEY);
      localStorage.removeItem(STORAGE_ANSWERS_KEY);
      window.location.href = data.redirect;
    });
}

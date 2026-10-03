let currentQ = Number(localStorage.getItem('testiq_current_q') || 0);
let answers = JSON.parse(localStorage.getItem('testiq_answers') || '{}');
let timeLeft = Number(localStorage.getItem('testiq_time') || 25 * 60);
let timerInterval = null;
let memoryTimerInterval = null;
let testActive = false;
let memoryHidden = false;
let userDetails = {};

function showPage(id) {
	document.querySelectorAll('section[id^="page-"]').forEach((page) => {
		page.style.display = 'none';
		page.classList.remove('fade-in');
	});
	const page = document.getElementById(id);
	if (!page) return;
	page.style.display = 'flex';
	requestAnimationFrame(() => page.classList.add('fade-in'));
}

function initTheme() {
	const theme = localStorage.getItem('testiq_theme') || 'dark';
	document.documentElement.dataset.theme = theme;
	updateThemeButtons(theme);
}

function toggleTheme() {
	const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
	document.documentElement.dataset.theme = next;
	localStorage.setItem('testiq_theme', next);
	updateThemeButtons(next);
}

function updateThemeButtons(theme) {
	document.querySelectorAll('.theme-toggle').forEach((button) => {
		button.textContent = theme === 'dark' ? 'Light theme' : 'Dark theme';
	});
}

function startTest() {
	testActive = true;
	currentQ = 0;
	answers = {};
	timeLeft = 25 * 60;
	localStorage.removeItem('testiq_answers');
	localStorage.setItem('testiq_time', timeLeft);
	localStorage.setItem('testiq_current_q', currentQ);
	startTimer();
	renderQuestion(currentQ);
	showPage('page-question');
}

function startTimer() {
	clearInterval(timerInterval);
	updateTimer();
	timerInterval = setInterval(() => {
		timeLeft -= 1;
		localStorage.setItem('testiq_time', timeLeft);
		updateTimer();
		if (timeLeft <= 0) {
			clearInterval(timerInterval);
			submitTest();
		}
	}, 1000);
}

function updateTimer() {
	const minutes = Math.max(0, Math.floor(timeLeft / 60)).toString().padStart(2, '0');
	const seconds = Math.max(0, timeLeft % 60).toString().padStart(2, '0');
	const timer = document.getElementById('timer');
	if (timer) {
		timer.textContent = `Time ${minutes}:${seconds}`;
		timer.className = timeLeft <= 300 ? 'timer timer-warn' : 'timer';
	}
}

function renderQuestion(index) {
	const question = questions[index];
	if (!question) return;
	clearInterval(memoryTimerInterval);
	currentQ = index;
	localStorage.setItem('testiq_current_q', currentQ);
	memoryHidden = false;
	document.getElementById('q-number').textContent = `Question ${index + 1} / ${questions.length}`;
	document.getElementById('progress-fill').style.width = `${((index + 1) / questions.length) * 100}%`;
	document.getElementById('cat-badge').textContent = `${question.emoji} ${question.category}`;
	const difficulty = document.getElementById('diff-badge');
	difficulty.textContent = question.difficulty[0].toUpperCase() + question.difficulty.slice(1);
	difficulty.className = `diff-badge diff-${question.difficulty}`;
	document.getElementById('q-text').textContent = question.question;
	const visual = document.getElementById('visual-area');
	visual.innerHTML = '';
	renderVisual(question, visual);
	const memoryArea = document.getElementById('memory-area');
	memoryArea.innerHTML = '';
	if (question.type === 'memory') renderMemorySequence(question, memoryArea);
	const options = document.getElementById('options-container');
	options.innerHTML = '';
	question.options.forEach((option, optionIndex) => {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = `option-btn${answers[question.id] === optionIndex ? ' selected' : ''}`;
		button.innerHTML = `<span class="opt-label">${String.fromCharCode(65 + optionIndex)}</span><span>${option}</span>`;
		button.hidden = question.type === 'memory';
		button.onclick = () => selectAnswer(question.id, optionIndex);
		options.appendChild(button);
	});
	document.getElementById('btn-back').disabled = index === 0;
	document.getElementById('btn-next').textContent = index === questions.length - 1 ? 'Finish Test' : 'Next';
	renderDots(index);
}

function renderVisual(question, container) {
	if (question.svg === 'q1') container.innerHTML = '<div class="shape-sequence"><span class="triangle"></span><span class="square"></span><span class="triangle"></span><span class="square"></span><span class="triangle"></span><b>?</b></div>';
	if (question.svg === 'q4-grid') container.innerHTML = '<table class="iq-grid"><tr><td>4</td><td>9</td><td>16</td></tr><tr><td>25</td><td>36</td><td>49</td></tr><tr><td>64</td><td>81</td><td class="missing">?</td></tr></table>';
	if (question.svg === 'q29-cube') container.innerHTML = '<div class="visual-diagram cube-diagram">4 x 4 x 4<br /><small>all faces painted red</small></div>';
	if (question.svg === 'q31-hexagon') container.innerHTML = '<div class="visual-diagram hex-diagram">HEXAGON<br /><small>all diagonals</small></div>';
}

function renderMemorySequence(question, container) {
	const box = document.createElement('div');
	box.id = 'memory-box';
	box.className = 'memory-sequence';
	if (question.memoryTableData) {
		box.innerHTML = `<table class="memory-grid-table">${question.memoryTableData.map((row) => `<tr>${row.map((cell) => `<td class="${cell === '?' ? 'missing' : ''}">${cell}</td>`).join('')}</tr>`).join('')}</table>`;
	} else {
		box.textContent = question.memoryDisplay;
	}
	const timer = document.createElement('div');
	timer.className = 'memory-countdown';
	timer.textContent = 'Hides in 7 seconds';
	container.append(box, timer);
	let secondsLeft = 7;
	memoryTimerInterval = setInterval(() => {
		secondsLeft -= 1;
		timer.textContent = secondsLeft > 0 ? `Hides in ${secondsLeft} second${secondsLeft === 1 ? '' : 's'}` : 'Sequence hidden';
		if (secondsLeft <= 0) {
			clearInterval(memoryTimerInterval);
			hideMemorySequence(box, timer);
		}
	}, 1000);
}

function hideMemorySequence(box, timer) {
	if (memoryHidden) return;
		box.classList.add('hidden');
		timer.classList.add('complete');
		memoryHidden = true;
		document.querySelectorAll('#options-container .option-btn').forEach((button) => { button.hidden = false; });
}

function selectAnswer(questionId, optionIndex) {
	answers[questionId] = optionIndex;
	localStorage.setItem('testiq_answers', JSON.stringify(answers));
	document.querySelectorAll('#options-container .option-btn').forEach((button, index) => button.classList.toggle('selected', index === optionIndex));
	renderDots(currentQ);
}

function nextQuestion() {
	if (currentQ === 25) {
		showPage('page-memory-disclaimer');
		return;
	}
	if (currentQ < questions.length - 1) {
		renderQuestion(currentQ + 1);
	} else {
		submitTest();
	}
}

function prevQuestion() {
	if (currentQ > 0) {
		renderQuestion(currentQ - 1);
		showPage('page-question');
	}
}

function continueToMemory() {
	renderQuestion(26);
	showPage('page-question');
}

function renderDots(activeIndex) {
	const tracker = document.getElementById('dot-tracker');
	if (!tracker) return;
	tracker.innerHTML = '';
	questions.forEach((question, index) => {
		const dot = document.createElement('button');
		dot.type = 'button';
		dot.className = `dot${answers[question.id] !== undefined ? ' answered' : ''}${index === activeIndex ? ' current' : ''}`;
		dot.title = `Question ${index + 1}`;
		dot.onclick = () => { renderQuestion(index); showPage('page-question'); };
		tracker.appendChild(dot);
	});
}

function calculateIQ(correct) {
	if (correct <= 3) return 62;
	if (correct <= 6) return 72;
	if (correct <= 9) return 82;
	if (correct <= 12) return 91;
	if (correct <= 14) return 97;
	if (correct <= 16) return 103;
	if (correct <= 18) return 109;
	if (correct <= 21) return 116;
	if (correct <= 24) return 122;
	if (correct <= 27) return 129;
	if (correct <= 29) return 135;
	if (correct <= 31) return 141;
	return 147;
}

function getIQCategory(iq) {
	if (iq < 70) return { label: 'Extremely Below Average', color: '#DC2626' };
	if (iq < 85) return { label: 'Below Average', color: '#EF4444' };
	if (iq < 100) return { label: 'Average', color: '#EAB308' };
	if (iq < 115) return { label: 'Above Average', color: '#22C55E' };
	if (iq < 130) return { label: 'Superior', color: '#3B82F6' };
	if (iq < 145) return { label: 'Gifted', color: '#8B5CF6' };
	return { label: 'Genius', color: '#EC4899' };
}

function submitTest() {
	testActive = false;
	clearInterval(timerInterval);
	showPage('page-userform');
}

function generateResults() {
	const values = { name: document.getElementById('inp-name').value.trim(), age: document.getElementById('inp-age').value.trim(), location: document.getElementById('inp-location').value.trim(), gender: document.getElementById('inp-gender').value };
	let valid = true;
	Object.entries(values).forEach(([key, value]) => {
		const id = { name: 'inp-name', age: 'inp-age', location: 'inp-location', gender: 'inp-gender' }[key];
		const error = document.getElementById(`${id}-err`);
		if (!value) { error.textContent = 'This field is required'; valid = false; } else error.textContent = '';
	});
	if (!valid) return;
	userDetails = values;
	const catScores = {};
	let correct = 0;
	questions.forEach((question) => {
		catScores[question.category] = catScores[question.category] || { correct: 0, total: 0 };
		catScores[question.category].total += 1;
		if (answers[question.id] === question.answer) { correct += 1; catScores[question.category].correct += 1; }
	});
	const iq = calculateIQ(correct);
	const category = getIQCategory(iq);
	window._testResult = { correct, iq, category, catScores, userDetails };
	document.getElementById('iq-display').textContent = '0';
	document.getElementById('iq-category').textContent = category.label;
	document.getElementById('iq-category').style.color = category.color;
	document.getElementById('result-message').textContent = iq >= 115 ? 'Excellent work. Your reasoning was consistently strong.' : 'A thoughtful result is a useful starting point for your next challenge.';
	let count = 0;
	const animation = setInterval(() => { count = Math.min(iq, count + Math.ceil(iq / 60)); document.getElementById('iq-display').textContent = count; if (count === iq) clearInterval(animation); }, 25);
	const labels = { 'Pattern Recognition': 'Pattern', 'Logical Reasoning': 'Logic', 'Numerical Ability': 'Numbers', 'Verbal / Linguistic': 'Verbal', 'Memory & Spatial': 'Memory' };
	document.getElementById('cat-breakdown').innerHTML = Object.entries(catScores).map(([label, score]) => `<div class="cat-row"><div><span>${labels[label]}</span><b>${score.correct} / ${score.total}</b></div><div class="cat-bar"><div class="cat-fill" style="width:${(score.correct / score.total) * 100}%"></div></div></div>`).join('');
	showPage('page-results');
}

function restartDueToViolation() {
	if (!testActive || document.getElementById('violation-overlay')) return;
	testActive = false;
	clearInterval(timerInterval);
	localStorage.removeItem('testiq_answers');
	localStorage.removeItem('testiq_time');
	localStorage.removeItem('testiq_current_q');
	const overlay = document.createElement('div');
	overlay.id = 'violation-overlay';
	overlay.innerHTML = '<div class="violation-card"><div class="violation-icon">!</div><h2>Test Restarted</h2><p>You switched tabs, minimised the browser, or left this window.</p><p>All answers have been cleared to protect test integrity.</p><button class="btn-primary" type="button" onclick="location.reload()">Restart Test</button></div>';
	document.body.appendChild(overlay);
}

document.addEventListener('visibilitychange', () => { if (document.hidden) restartDueToViolation(); });
window.addEventListener('blur', restartDueToViolation);
document.addEventListener('keydown', (event) => {
	if (event.key >= '1' && event.key <= '4' && document.getElementById('page-question').style.display !== 'none') selectAnswer(questions[currentQ].id, Number(event.key) - 1);
	if (event.key === 'Enter' && document.getElementById('page-question').style.display !== 'none') nextQuestion();
	if (event.key === 'ArrowLeft' && document.getElementById('page-question').style.display !== 'none') prevQuestion();
});

window.addEventListener('load', () => {
	initTheme();
	const savedQuestion = localStorage.getItem('testiq_current_q');
	const savedAnswers = localStorage.getItem('testiq_answers');
	if (savedQuestion !== null && savedAnswers && timeLeft > 0) {
		testActive = true;
		startTimer();
		renderQuestion(currentQ);
		showPage('page-question');
	} else {
		showPage('page-landing');
	}
});

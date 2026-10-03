function showCertificate() {
  const result = window._testResult;
  if (!result) return;
  const { iq, category, correct, catScores, userDetails } = result;
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const categoryValue = (label) => {
    const score = catScores[label];
    return score ? `${score.correct} / ${score.total}` : '0 / 0';
  };
  document.getElementById('cert-name').textContent = userDetails.name;
  document.getElementById('cert-age').textContent = userDetails.age;
  document.getElementById('cert-gender').textContent = userDetails.gender;
  document.getElementById('cert-location').textContent = userDetails.location;
  document.getElementById('cert-iq').textContent = `IQ Score: ${iq}`;
  document.getElementById('cert-category').textContent = category.label;
  document.getElementById('cert-date').textContent = date;
  document.getElementById('cert-score').textContent = `${correct} / ${questions.length}`;
  document.getElementById('cert-pattern').textContent = categoryValue('Pattern Recognition');
  document.getElementById('cert-logic').textContent = categoryValue('Logical Reasoning');
  document.getElementById('cert-numerical').textContent = categoryValue('Numerical Ability');
  document.getElementById('cert-verbal').textContent = categoryValue('Verbal / Linguistic');
  document.getElementById('cert-memory').textContent = categoryValue('Memory & Spatial');
  document.getElementById('cert-range').textContent = `[${category.label}]`;
  showPage('page-certificate');
  if (typeof confetti === 'function') {
    setTimeout(() => confetti({ particleCount: 180, spread: 80, origin: { y: 0.55 }, colors: ['#3B82F6', '#8B5CF6', '#EC4899', '#22C55E', '#F59E0B'] }), 250);
  }
}

function printCertificate() {
  window.print();
}

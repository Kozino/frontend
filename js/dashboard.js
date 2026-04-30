// Check authentication
if (!api.token) {
    window.location.href = 'login.html';
}

// Load user data
async function loadDashboard() {
    try {
        // Get ESG Score
        const scoreData = await api.getESGScore();
        document.getElementById('totalScore').textContent = scoreData.score;
        document.getElementById('envScore').textContent = scoreData.environment;
        document.getElementById('socialScore').textContent = scoreData.social;
        document.getElementById('govScore').textContent = scoreData.governance;
        
        // Update badge
        const levelBadge = document.getElementById('esgLevel');
        levelBadge.className = `badge badge-${scoreData.level.toLowerCase()}`;
        levelBadge.textContent = scoreData.level;
        
        // Update score circles
        updateCircle('scoreCircle', scoreData.score);
        updateCircle('envCircle', scoreData.environment);
        updateCircle('socialCircle', scoreData.social);
        updateCircle('govCircle', scoreData.governance);
        
        // Get recent data
        const history = await api.getESGHistory();
        const recentDataDiv = document.getElementById('recentData');
        if (history && history.length > 0) {
            const latest = history[0];
            recentDataDiv.innerHTML = `
                <p><strong>Latest Entry:</strong> ${latest.reporting_year}</p>
                <p>Scope 1: ${latest.scope1_emissions} tCO2e | Scope 2: ${latest.scope2_emissions} tCO2e</p>
                <p>Employees: ${latest.total_employees} | Women in Board: ${latest.women_in_board_percentage}%</p>
            `;
        }
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

function updateCircle(elementId, score) {
    const circle = document.getElementById(elementId);
    const percentage = (score / 100) * 360;
    circle.style.background = `conic-gradient(var(--primary) ${percentage}deg, #ecf0f1 ${percentage}deg)`;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Logout handler
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    api.logout();
});

// Load dashboard on page load
loadDashboard();
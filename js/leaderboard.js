/**
 * Leaderboard Component for Algorithm Quiz Scores
 * 
 * This script provides a reusable leaderboard component that can be
 * included in any algorithm page to display the top scores.
 */

// Only define API_URL if it's not already defined
if (typeof API_URL === 'undefined') {
    const API_URL = 'https://security-viz-api.onrender.com';
}

// Updated to only use hardcoded buttons and not create any dynamically
async function initializeLeaderboard() {
    // Get the current algorithm name from the page title
    const pageTitle = document.title;
    const algorithmMatch = pageTitle.match(/(AES|DES|RSA|SHA-256|Blowfish|Quantum)/i);
    
    if (!algorithmMatch) {
        console.error('Could not determine algorithm type from page title');
        return;
    }
    
    const algorithmName = algorithmMatch[0];
    console.log(`Initializing leaderboard for ${algorithmName}`);
    
    // Find existing hardcoded button and set up its functionality
    const existingHardcodedButton = document.querySelector('button.leaderboard-button');
    if (existingHardcodedButton) {
        console.log('Found hardcoded leaderboard button, using it');
        // Update onclick for the existing button
        existingHardcodedButton.onclick = () => showLeaderboard(algorithmName);
    } else {
        console.log('No hardcoded leaderboard button found on this page');
    }
    
    // Create leaderboard overlay and modal if they don't exist
    if (!document.getElementById('leaderboardOverlay')) {
        const leaderboardOverlay = document.createElement('div');
        leaderboardOverlay.id = 'leaderboardOverlay';
        leaderboardOverlay.className = 'leaderboard-overlay';
        leaderboardOverlay.style.display = 'none';
        document.body.appendChild(leaderboardOverlay);
        
        // Add event listener to close when clicking overlay
        leaderboardOverlay.addEventListener('click', closeLeaderboard);
    }
    
    if (!document.getElementById('leaderboardModal')) {
        const leaderboardModal = document.createElement('div');
        leaderboardModal.id = 'leaderboardModal';
        leaderboardModal.className = 'leaderboard-modal';
        leaderboardModal.style.display = 'none';
        document.body.appendChild(leaderboardModal);
    }
    
    // Add CSS styles for the leaderboard if they don't exist already
    if (!document.getElementById('leaderboardStyles')) {
        addLeaderboardStyles();
    }
}

// Function to show the leaderboard popup
async function showLeaderboard(algorithmName) {
    const overlay = document.getElementById('leaderboardOverlay');
    const modal = document.getElementById('leaderboardModal');
    
    if (!overlay || !modal) {
        console.error('Leaderboard overlay or modal not found');
        return;
    }
    
    overlay.style.display = 'block';
    modal.style.display = 'block';
    
    // Show loading indicator
    modal.innerHTML = `
        <div class="leaderboard-loading">
            <div class="spinner"></div>
            <p>Loading leaderboard...</p>
        </div>
    `;
    
    try {
        // Fetch leaderboard data
        const response = await fetch(`${API_URL}/get-leaderboard?algorithm=${algorithmName}`);
        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard');
        }
        
        const data = await response.json();
        
        // Get user's score if logged in
        let userScore = null;
        const sessionId = getCookie('session_id');
        if (sessionId) {
            try {
                const userResponse = await fetch(`${API_URL}/get-user-scores`, {
                    headers: { 'X-Session-ID': sessionId }
                });
                
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    if (userData.scores && userData.scores[algorithmName]) {
                        userScore = userData.scores[algorithmName];
                    }
                }
            } catch (error) {
                console.error('Error fetching user score:', error);
            }
        }
        
        // Generate leaderboard HTML
        let leaderboardHTML = `
            <div class="leaderboard-header">
                <h2>${algorithmName} Leaderboard</h2>
                <button onclick="closeLeaderboard()" class="close-btn" title="Close">×</button>
            </div>
        `;
        
        if (data.leaderboard && data.leaderboard.length > 0) {
            leaderboardHTML += `
                <div class="leaderboard-table">
                    <div class="leaderboard-row header">
                        <div class="rank">RANK</div>
                        <div class="username">USER</div>
                        <div class="score">SCORE</div>
                    </div>
            `;
            
            data.leaderboard.forEach((entry, index) => {
                const isCurrentUser = userScore && entry.username === userScore.username;
                const rankLabel = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
                
                leaderboardHTML += `
                    <div class="leaderboard-row ${isCurrentUser ? 'current-user' : ''}">
                        <div class="rank">${rankLabel}</div>
                        <div class="username">${entry.username}</div>
                        <div class="score">${Math.round(entry.percentage)}%</div>
                    </div>
                `;
            });
            
            leaderboardHTML += `</div>`;
            
            // Show user's score if logged in but not in top leaderboard
            if (userScore && !data.leaderboard.some(entry => entry.username === userScore.username)) {
                leaderboardHTML += `
                    <div class="user-score">
                        <p>Your best score: ${Math.round(userScore.percentage)}%</p>
                    </div>
                `;
            }
        } else {
            leaderboardHTML += `
                <div class="empty-leaderboard">
                    <p>No scores yet. Be the first to take the quiz!</p>
                </div>
            `;
        }
        
        modal.innerHTML = leaderboardHTML;
    } catch (error) {
        console.error('Error showing leaderboard:', error);
        modal.innerHTML = `
            <div class="leaderboard-header">
                <h2>Error</h2>
                <button onclick="closeLeaderboard()" class="close-btn" title="Close">×</button>
            </div>
            <div class="leaderboard-error">
                <p>Failed to load leaderboard. Please try again later.</p>
            </div>
        `;
    }
}

// Function to close the leaderboard popup
function closeLeaderboard() {
    const overlay = document.getElementById('leaderboardOverlay');
    const modal = document.getElementById('leaderboardModal');
    
    if (overlay) overlay.style.display = 'none';
    if (modal) modal.style.display = 'none';
}

// Function to add CSS styles for the leaderboard
function addLeaderboardStyles() {
    const styleEl = document.createElement('style');
    styleEl.id = 'leaderboardStyles';
    styleEl.textContent = `
        .leaderboard-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }
        
        .leaderboard-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            background: #1f2937;
            border-radius: 10px;
            z-index: 1001;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        }
        
        .leaderboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: #111827;
            border-top-left-radius: 10px;
            border-top-right-radius: 10px;
            border-bottom: 1px solid #374151;
        }
        
        .leaderboard-header h2 {
            color: #00d2ff;
            margin: 0;
            font-size: 1.5rem;
            text-shadow: 0 0 5px rgba(0, 210, 255, 0.5);
        }
        
        .leaderboard-header .close-btn {
            background: transparent;
            border: none;
            color: #ffffff;
            font-size: 1.5rem;
            cursor: pointer;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        }
        
        .leaderboard-header .close-btn:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .leaderboard-table {
            padding: 0 20px;
        }
        
        .leaderboard-row {
            display: grid;
            grid-template-columns: 60px 1fr 80px;
            padding: 12px 0;
            border-bottom: 1px solid #2d3748;
        }
        
        .leaderboard-row.header {
            color: #a0aec0;
            font-weight: bold;
            font-size: 0.9rem;
            text-transform: uppercase;
            padding-bottom: 15px;
        }
        
        .leaderboard-row.current-user {
            background: rgba(0, 210, 255, 0.1);
            border-radius: 5px;
            padding: 12px 10px;
        }
        
        .empty-leaderboard, .leaderboard-error, .leaderboard-loading, .user-score {
            padding: 30px 20px;
            text-align: center;
            color: #ffffff;
        }
        
        .leaderboard-error {
            color: #ef4444;
        }
        
        .user-score {
            border-top: 1px solid #374151;
            margin-top: 10px;
            font-weight: bold;
            color: #00d2ff;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.1);
            border-left-color: #00d2ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* Add styles for the rank, username, and score columns */
        .leaderboard-row .rank {
            font-weight: bold;
            color: #00d2ff;
            font-size: 1rem;
        }
        
        .leaderboard-row .username {
            color: #ffffff;
            font-size: 1rem;
        }
        
        .leaderboard-row .score {
            font-weight: bold;
            color: #10b981;
            text-align: right;
            font-size: 1rem;
        }
        
        /* Add medal colors for top ranks */
        .leaderboard-row:nth-child(2) .rank {
            color: gold;
            text-shadow: 0 0 3px rgba(255, 215, 0, 0.5);
        }
        
        .leaderboard-row:nth-child(3) .rank {
            color: silver;
            text-shadow: 0 0 3px rgba(192, 192, 192, 0.5);
        }
        
        .leaderboard-row:nth-child(4) .rank {
            color: #cd7f32; /* bronze */
            text-shadow: 0 0 3px rgba(205, 127, 50, 0.5);
        }
    `;
    
    document.head.appendChild(styleEl);
}

// Helper function to get cookie value
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Initialize the leaderboard when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing leaderboard');
    
    // Find any existing hardcoded button
    const existingHardcodedButton = document.querySelector('button.leaderboard-button');
    
    if (existingHardcodedButton) {
        console.log('Found hardcoded leaderboard button');
        
        // Get algorithm name from page title
        const pageTitle = document.title;
        const algorithmMatch = pageTitle.match(/(AES|DES|RSA|SHA-256|Blowfish|Quantum)/i);
        const algorithmName = algorithmMatch ? algorithmMatch[0] : 'AES';
        
        // Update the button's click handler
        existingHardcodedButton.onclick = () => showLeaderboard(algorithmName);
        
        // Create required modal elements
        if (!document.getElementById('leaderboardOverlay')) {
            const leaderboardOverlay = document.createElement('div');
            leaderboardOverlay.id = 'leaderboardOverlay';
            leaderboardOverlay.className = 'leaderboard-overlay';
            leaderboardOverlay.style.display = 'none';
            document.body.appendChild(leaderboardOverlay);
            
            // Add event listener to close when clicking overlay
            leaderboardOverlay.addEventListener('click', closeLeaderboard);
        }
        
        if (!document.getElementById('leaderboardModal')) {
            const leaderboardModal = document.createElement('div');
            leaderboardModal.id = 'leaderboardModal';
            leaderboardModal.className = 'leaderboard-modal';
            leaderboardModal.style.display = 'none';
            document.body.appendChild(leaderboardModal);
        }
        
        // Add CSS styles for the leaderboard if they don't exist already
        if (!document.getElementById('leaderboardStyles')) {
            addLeaderboardStyles();
        }
    }
});

// Make functions globally available
window.showLeaderboard = showLeaderboard;
window.closeLeaderboard = closeLeaderboard; 
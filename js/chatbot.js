const GEMINI_API_KEY = 'AIzaSyBrK0B3Vf1_ijv3U90GiaNwomdRCEtK7QQ';

async function sendMessage(message) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: message
                    }]
                }]
            })
        });

        const data = await response.json();
        
        // Check if the response has the expected structure
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
            return data.candidates[0].content.parts[0].text;
        } else {
            console.error('Unexpected response structure:', data);
            return 'Sorry, I received an unexpected response format.';
        }
    } catch (error) {
        console.error('Error:', error);
        return 'Sorry, I encountered an error processing your request.';
    }
}

function appendMessage(message, isUser) {
    const chatBox = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.textContent = message;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function handleUserInput() {
    const inputField = document.getElementById('user-input');
    const message = inputField.value.trim();
    
    if (message) {
        appendMessage(message, true);
        inputField.value = '';
        
        // Show loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot-message loading';
        loadingDiv.textContent = 'Thinking...';
        document.getElementById('chat-messages').appendChild(loadingDiv);
        
        try {
            const response = await sendMessage(message);
            loadingDiv.remove();
            appendMessage(response, false);
        } catch (error) {
            loadingDiv.remove();
            appendMessage('Sorry, something went wrong. Please try again.', false);
        }
    }
}

// Initial message when chat opens
document.addEventListener('DOMContentLoaded', () => {
    appendMessage('Hello! I\'m your AI assistant. Ask me anything about security algorithms!', false);
}); 
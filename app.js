// Configuration
const API_BASE = 'https://api.wakely.ai/api';
const N8N_WEBHOOK = 'https://n8n.wakely.ai/webhook/web-chat';

// Extract org slug from URL
const pathParts = window.location.pathname.split('/');
const orgSlug = pathParts[1];

// Session management
let sessionId = localStorage.getItem('chat_session');
if (!sessionId) {
    sessionId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('chat_session', sessionId);
}

let organization = null;

// Initialize
async function init() {
    try {
        // Fetch organization details
        const response = await fetch(`${API_BASE}/public/org/${orgSlug}`);
        if (!response.ok) throw new Error('Organization not found');
        
        organization = await response.json();
        document.getElementById('org-name').textContent = organization.name;
        
        // Set up event listeners
        document.getElementById('send-btn').addEventListener('click', sendMessage);
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
        
        // Show welcome message
        addMessage('bot', `Welcome to ${organization.name}! How can I help you today?`);
        
    } catch (error) {
        console.error('Init error:', error);
        document.getElementById('org-name').textContent = 'Chat Service';
        addMessage('bot', 'Welcome! How can I help you?');
    }
}

// Send message
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessage('user', message);
    input.value = '';
    
    // Show typing indicator
    const typingId = showTyping();
    
    try {
        // Send to n8n webhook
        const response = await fetch(N8N_WEBHOOK, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                userId: sessionId,
                whatsapp_number: organization?.whatsapp_number || '',
                channel: 'web'
            })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        removeTyping(typingId);
        
        // Add bot response
        if (data.BotReply) {
            addMessage('bot', data.BotReply);
        } else {
            addMessage('bot', 'I received your message. Let me help you with that.');
        }
        
    } catch (error) {
        console.error('Send error:', error);
        removeTyping(typingId);
        addMessage('bot', 'Sorry, I encountered an error. Please try again.');
    }
}

// Add message to chat
function addMessage(sender, text) {
    const messagesDiv = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = text;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Show typing indicator
function showTyping() {
    const id = 'typing_' + Date.now();
    const messagesDiv = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.id = id;
    typingDiv.className = 'message bot';
    typingDiv.textContent = '...';
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return id;
}

// Remove typing indicator
function removeTyping(id) {
    const element = document.getElementById(id);
    if (element) element.remove();
}

// Start the app
init();

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
    
    // Create message wrapper
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'message-wrapper';
    
    // Create message container
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    // Create avatar
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.textContent = sender === 'user' ? 'U' : 'T';  // U for User, T for Toastable
    
    // Create content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Add sender label
    const labelDiv = document.createElement('div');
    labelDiv.className = 'message-label';
    labelDiv.textContent = sender === 'user' ? 'You' : organization?.name || 'Assistant';
    
    // Add message text
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = text;
    
    // Add timestamp
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Assemble the message
    contentDiv.appendChild(labelDiv);
    contentDiv.appendChild(textDiv);
    contentDiv.appendChild(timeDiv);
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    wrapperDiv.appendChild(messageDiv);
    
    messagesDiv.appendChild(wrapperDiv);
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

// Mobile keyboard handling
let viewportHeight = window.innerHeight;
let isKeyboardOpen = false;

function handleViewportChange() {
    const currentHeight = window.innerHeight;
    const heightDifference = viewportHeight - currentHeight;
    
    // Keyboard is likely open if height decreased by more than 100px
    if (heightDifference > 100) {
        isKeyboardOpen = true;
        document.body.classList.add('keyboard-open');
        
        // Scroll to bottom to show input
        const chatMessages = document.getElementById('chat-messages');
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    } else if (isKeyboardOpen && heightDifference < 50) {
        isKeyboardOpen = false;
        document.body.classList.remove('keyboard-open');
    }
}

// Listen for viewport changes
window.visualViewport?.addEventListener('resize', handleViewportChange);
window.addEventListener('resize', handleViewportChange);

// Focus/blur handling for input
document.getElementById('chat-input').addEventListener('focus', () => {
    document.body.classList.add('input-focused');
    setTimeout(() => {
        document.getElementById('chat-input').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
});

document.getElementById('chat-input').addEventListener('blur', () => {
    document.body.classList.remove('input-focused');
});

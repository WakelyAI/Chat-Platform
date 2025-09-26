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
let isSending = false;

// Initialize
async function init() {
    try {
        // Fetch organization details
        const response = await fetch(`${API_BASE}/public/org/${orgSlug}`);
        if (!response.ok) throw new Error('Organization not found');
        
        organization = await response.json();
        document.getElementById('org-name').textContent = organization.name;
        
        // Set up event listeners properly
        const sendBtn = document.getElementById('send-btn');
        const chatInput = document.getElementById('chat-input');
        
        // Remove any inline handlers from HTML
        sendBtn.onclick = null;
        chatInput.onkeydown = null;
        
        // Single click handler
        sendBtn.addEventListener('click', handleSend);
        
        // Single Enter key handler
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });
        
        // Auto-resize textarea with debounce
        let resizeTimeout;
        chatInput.addEventListener('input', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                chatInput.style.height = 'auto';
                chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
            }, 10);
        });
        
        // Show welcome message
        addMessage('bot', `Welcome to ${organization.name}! How can I help you today?`);
        
    } catch (error) {
        console.error('Init error:', error);
        document.getElementById('org-name').textContent = 'Chat Service';
        addMessage('bot', 'Welcome! How can I help you?');
    }
}

// Main send handler
async function handleSend() {
    if (isSending) return;
    
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Set sending state
    isSending = true;
    sendBtn.disabled = true;
    sendBtn.classList.add('sending');
    input.disabled = true;
    
    // Clear input immediately
    input.value = '';
    input.style.height = 'auto';
    
    // Add user message
    addMessage('user', message);
    
    // Show typing indicator
    const typingId = showTyping();
    
    try {
        // Request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
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
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
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
        
        if (error.name === 'AbortError') {
            addMessage('bot', 'The request timed out. Please try again.');
        } else {
            addMessage('bot', 'Sorry, I encountered an error. Please try again.');
        }
    } finally {
        // Always reset state
        isSending = false;
        sendBtn.disabled = false;
        sendBtn.classList.remove('sending');
        input.disabled = false;
        
        // Focus on desktop only
        if (window.innerWidth > 768) {
            input.focus();
        }
    }
}

// Backward compatibility
function sendMessage() {
    handleSend();
}

// Add message to chat
function addMessage(sender, text) {
    const messagesDiv = document.getElementById('chat-messages');
    
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'message-wrapper';
    
    // Create message structure
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    // Avatar
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.textContent = sender === 'user' ? 'U' : 'T';
    
    // Content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Label
    const labelDiv = document.createElement('div');
    labelDiv.className = 'message-label';
    labelDiv.textContent = sender === 'user' ? 'You' : organization?.name || 'Assistant';
    
    // Text
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = text;
    
    // Time
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Assemble
    contentDiv.appendChild(labelDiv);
    contentDiv.appendChild(textDiv);
    contentDiv.appendChild(timeDiv);
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    wrapperDiv.appendChild(messageDiv);
    
    messagesDiv.appendChild(wrapperDiv);
    
    // Smooth scroll
    requestAnimationFrame(() => {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

// Show typing indicator
function showTyping() {
    const id = 'typing_' + Date.now();
    const messagesDiv = document.getElementById('chat-messages');
    
    const wrapperDiv = document.createElement('div');
    wrapperDiv.id = id;
    wrapperDiv.className = 'message-wrapper typing-wrapper';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot typing';
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.textContent = 'T';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content typing-content';
    contentDiv.innerHTML = '<span></span><span></span><span></span>';
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    wrapperDiv.appendChild(messageDiv);
    
    messagesDiv.appendChild(wrapperDiv);
    
    requestAnimationFrame(() => {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
    
    return id;
}

// Remove typing indicator
function removeTyping(id) {
    const element = document.getElementById(id);
    if (element) element.remove();
}

// Start the app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Better mobile handling
if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    // Don't auto-scroll on focus - let the browser handle it
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('focus', () => {
            // Just ensure messages are scrolled to bottom
            const messagesDiv = document.getElementById('chat-messages');
            if (messagesDiv) {
                setTimeout(() => {
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                }, 300);
            }
        });
    }
}

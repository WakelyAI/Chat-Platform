/**
 * Chat Module
 * Handles all chat messaging functionality
 */

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
    // input.disabled = true; // Allow typing while waiting
    
    // Clear input
    input.value = '';
    input.style.height = 'auto';
    
    // Add user message
    addMessage('user', message);
    
    // Show typing indicator
    const typingId = showTyping();
    
    try {
        const data = await ApiService.sendChatMessage(message, sessionId, organization);
        
        console.log('Full response from n8n:', data);
        
        if (data.orderState) {
            window.currentOrderState = data.orderState;
            console.log('Order state updated:', window.currentOrderState);
            updateOrderPanel(window.currentOrderState);
            showMenuButton();
        }
        
        removeTyping(typingId);
        
        if (data.BotReply) {
            addMessage('bot', data.BotReply, data);
        } else {
            addMessage('bot', 'I received your message. Let me help you with that.');
        }
        
    } catch (error) {
        console.error('Send error:', error);
        removeTyping(typingId);
        
        if (error.message === 'timeout') {
            addMessage('bot', i18n.t('errorTimeout'));
        } else {
            addMessage('bot', i18n.t('errorGeneric'));
        }
    } finally {
        isSending = false;
        sendBtn.disabled = false;
        sendBtn.classList.remove('sending');
        // input.disabled = false; // No longer needed
        
        if (window.innerWidth > 768) {
            input.focus();
        }
    }
}

// Backward compatibility wrapper
function sendMessage() {
    handleSend();
}

function addMessage(sender, text, metadata = null) {
    const messagesDiv = document.getElementById('chat-messages');
    
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'message-wrapper';
    
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
    
    // Text with URL linking (or Order Confirmation Card)
    const textDiv = document.createElement('div');
    
    // Check if this is an order confirmation
    if (CONFIG.FEATURES.ORDER_CONFIRMATION_CARD && 
        metadata?.messageType === 'ORDER_CONFIRMATION' && 
        metadata?.orderData) {
        
        const orderData = metadata.orderData;
        textDiv.className = 'message-text order-confirmation-card';
        
        // Build HTML using your pattern (like renderOrderItems)
        textDiv.innerHTML = `
            <div class="confirmation-header">
                <div class="confirmation-icon">✅</div>
                <div class="confirmation-title">${i18n.t('orderSent')}</div>
            </div>
            <div class="order-number">#${orderData.orderReference}</div>
            <div class="order-details">
                <div class="detail-row">
                    <span class="detail-label">👤</span>
                    <span class="detail-value">${orderData.customerName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">💰</span>
                    <span class="detail-value">${i18n.formatPrice(orderData.totalAmount)}</span>
                </div>
                <div class="detail-row highlight">
                    <span class="detail-label">⏱️</span>
                    <span class="detail-value">${i18n.t('prepTime')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📍</span>
                    <span class="detail-value">${i18n.t('pickupLocation')}</span>
                </div>
            </div>
            <div class="confirmation-footer">${i18n.t('enjoy')}</div>
        `;
        
        // Save to localStorage
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_ORDER, JSON.stringify({
                ...orderData,
                confirmedAt: Date.now(),
                expiresAt: Date.now() + (24 * 60 * 60 * 1000)
            }));
        } catch (e) {
            console.error('localStorage error:', e);
        }
    } else {
        // Normal message with URL linking
        textDiv.className = 'message-text';
        
        function linkifyText(text) {
            const escaped = text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
            
            return escaped.replace(
                /(https?:\/\/[^\s]+)/g,
                '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #007bff; text-decoration: underline;">$1</a>'
            );
        }
        
        textDiv.innerHTML = linkifyText(text);
    }
    
    textDiv.innerHTML = linkifyText(text);
    
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

function removeTyping(id) {
    const element = document.getElementById(id);
    if (element) element.remove();
}

function adjustSpacing() {
    const inputContainer = document.getElementById('chat-input-container');
    const chatMessages = document.getElementById('chat-messages');
    
    if (inputContainer && chatMessages) {
        const inputHeight = inputContainer.offsetHeight;
        chatMessages.style.paddingBottom = `${inputHeight + 20}px`;
    }
}


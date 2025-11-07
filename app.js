// ============================================
// CONFIGURATION & GLOBAL VARIABLES
// ============================================
const API_BASE = 'https://api.wakely.ai/api';
const N8N_WEBHOOK = 'https://n8n.wakely.ai/webhook/web-chat';

// Extract org slug from URL
const pathParts = window.location.pathname.split('/');
const orgSlug = pathParts[1];

// Global state variables
let organizationId = null;
let organization = null;
let isSending = false;
let isChangingLanguage = false;
window.currentOrderState = null;

// Session management
let sessionId = localStorage.getItem('chat_session');
if (!sessionId) {
    sessionId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('chat_session', sessionId);
}

// Menu system globals
window.menuData = [];
window.currentCategory = 'all';

// Touch handling for mobile
let touchStartY = 0;
let currentY = 0;

// ============================================
// INITIALIZATION SECTION
// ============================================
async function init() {
    try {
        // Fetch organization details
        const response = await fetch(`${API_BASE}/public/org/${orgSlug}`);
        if (!response.ok) throw new Error('Organization not found');
        
        organization = await response.json();
        organizationId = organization.organization_id;
        document.getElementById('org-name').textContent = organization.name;
        
        // Apply branding if exists
        if (organization.brand_assets) {
            const assets = organization.brand_assets;
            
            // Apply logo if exists
            const logoContainer = document.getElementById('org-logo');
            const nameContainer = document.getElementById('org-name');
            
            if (assets.logo_url && logoContainer) {
                logoContainer.src = assets.logo_url;
                logoContainer.style.display = 'block';
                logoContainer.onerror = function() {
                    this.style.display = 'none';
                    if (nameContainer) nameContainer.style.display = 'block';
                };
                if (nameContainer) nameContainer.style.display = 'none';
            }
            
            // Apply colors if exist
            if (assets.header_color) {
                const style = document.createElement('style');
                style.innerHTML = `
                    #chat-header { background: ${assets.header_color} !important; }
                    #chat-input-container { background: ${assets.header_color} !important; }
                `;
                document.head.appendChild(style);
            }
            if (assets.bg_color) {
                document.documentElement.style.setProperty('--bg-primary', assets.bg_color);
            }
            if (assets.button_color) {
                document.documentElement.style.setProperty('--primary-color', assets.button_color);
            }
        }

        // Set up event listeners
        const sendBtn = document.getElementById('send-btn');
        const chatInput = document.getElementById('chat-input');
        
        // Remove any inline handlers
        sendBtn.onclick = null;
        chatInput.onkeydown = null;
        
        // Add event listeners
        sendBtn.addEventListener('click', handleSend);
        
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });
        
        // Auto-resize textarea
        let resizeTimeout;
        chatInput.addEventListener('input', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                chatInput.style.height = 'auto';
                chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
            }, 10);
        });
        
        // Show welcome message
        addMessage('bot', i18n.t('welcome', organization.name));
        
    } catch (error) {
        console.error('Init error:', error);
        document.getElementById('org-name').textContent = i18n.t('chatService');
        addMessage('bot', i18n.t('welcomeFallback'));
    }
}

// ============================================
// LANGUAGE SYSTEM
// ============================================

// ============================================
// CHAT SYSTEM
// ============================================
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
    
    // Clear input
    input.value = '';
    input.style.height = 'auto';
    
    // Add user message
    addMessage('user', message);
    
    // Show typing indicator
    const typingId = showTyping();
    
    try {
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
        console.log('Full response from n8n:', data);
        
        if (data.orderState) {
            window.currentOrderState = data.orderState;
            console.log('Order state updated:', window.currentOrderState);
            updateOrderPanel(window.currentOrderState);
            showMenuButton();
        }
        
        removeTyping(typingId);
        
        if (data.BotReply) {
            addMessage('bot', data.BotReply);
        } else {
            addMessage('bot', 'I received your message. Let me help you with that.');
        }
        
    } catch (error) {
        console.error('Send error:', error);
        removeTyping(typingId);
        
        if (error.name === 'AbortError') {
            addMessage('bot', i18n.t('errorTimeout'));
        } else {
            addMessage('bot', i18n.t('errorGeneric'));
        }
    } finally {
        isSending = false;
        sendBtn.disabled = false;
        sendBtn.classList.remove('sending');
        input.disabled = false;
        
        if (window.innerWidth > 768) {
            input.focus();
        }
    }
}

// Backward compatibility wrapper
function sendMessage() {
    handleSend();
}

function addMessage(sender, text) {
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
    
    // Text with URL linking
    const textDiv = document.createElement('div');
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

// ============================================
// MENU SYSTEM
// ============================================
async function loadMenu() {
    try {
        const response = await fetch(`https://api.wakely.ai/api/public/menu/${organizationId}`);
        
        if (!response.ok) return;
        
        const data = await response.json();
        window.menuData = data.menu;
        
        // Extract unique categories
        const categories = [...new Set(window.menuData.map(item => item.category))].filter(Boolean);
        
        // Build category tabs
        const categoryHtml = `
            <button class="category-tab active" data-category="all" onclick="filterCategory('all')">All</button>
            ${categories.map(cat => 
                `<button class="category-tab" data-category="${cat}" onclick="filterCategory('${cat}')">${cat}</button>`
            ).join('')}
        `;
        document.getElementById('menu-categories').innerHTML = categoryHtml;
        
        // Display all items
        displayMenuItems(window.menuData);
    } catch (error) {
        console.error('Failed to load menu:', error);
    }
}

function displayMenuItems(items) {
    const container = document.getElementById('menu-items');
    
    if (!items.length) {
        container.innerHTML = `<div class="menu-loading">${i18n.t('noItems')}</div>`;
        return;
    }
    
    container.innerHTML = items.map(item => {
        const itemName = i18n.getItemName(item);
        const itemDesc = i18n.getItemDescription(item);
        
        return `
            <div class="menu-item" onclick="askAboutItem('${item.name}')">
                <div class="menu-item-image">
                    ${item.image ? `<img src="${item.image}" alt="${itemName}" style="width:100%;height:100%;object-fit:cover;">` : getItemEmoji(item.category)}
                </div>
                <div class="menu-item-details">
                    <div class="menu-item-name">${itemName}</div>
                    <div class="menu-item-description">${itemDesc}</div>
                    <div class="menu-item-price">${i18n.formatPrice(item.price)}</div>
                </div>
            </div>
        `;
    }).join('');
}

function filterCategory(category) {
    window.currentCategory = category;
    
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === category);
    });
    
    const filtered = category === 'all' 
        ? window.menuData 
        : window.menuData.filter(item => item.category === category);
    
    displayMenuItems(filtered);
}

function searchMenu() {
    const query = document.getElementById('menu-search').value.toLowerCase();
    
    const filtered = window.menuData.filter(item => 
        item.name.toLowerCase().includes(query) ||
        (item.name_ar && item.name_ar.includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query))
    );
    
    displayMenuItems(filtered);
}

function getItemEmoji(category) {
    const emojis = {
        'Hot Drinks': '☕',
        'Cold Drinks': '🥤',
        'Sandwiches': '🥪',
        'Breakfast': '🍳',
        'Desserts': '🍰',
        'Salads': '🥗'
    };
    return `<span>${emojis[category] || '🍽️'}</span>`;
}

function toggleMenu() {
    const panel = document.getElementById('menu-panel');
    const overlay = document.getElementById('menu-overlay');
    
    panel.classList.toggle('active');
    overlay.classList.toggle('active');
    
    if (panel.classList.contains('active') && window.menuData.length === 0) {
        loadMenu();
    }
}

function closeMenu() {
    document.getElementById('menu-panel').classList.remove('active');
    document.getElementById('menu-overlay').classList.remove('active');
}

function askAboutItem(itemName) {
    closeMenu();
    const input = document.getElementById('chat-input');
    input.value = `Tell me about ${itemName}`;
    input.focus();
}

function showMenuButton() {
    document.getElementById('menu-btn').classList.remove('hidden');
}

// ============================================
// ORDER SYSTEM
// ============================================
function updateOrderPanel(orderState) {
    if (!orderState || !orderState.items || orderState.items.length === 0) {
        hideOrderIndicators();
        return;
    }
    
    const itemCount = orderState.items.reduce((sum, item) => sum + item.quantity, 0);
    showOrderIndicators(itemCount);
    renderOrderItems(orderState);
}

function showOrderIndicators(count) {
    const btn = document.getElementById('mobile-order-btn');
    const badge = document.getElementById('order-badge');
    
    if (btn && badge) {
        btn.classList.remove('hidden');
        badge.textContent = count;
    }
}

function hideOrderIndicators() {
    const btn = document.getElementById('mobile-order-btn');
    if (btn) {
        btn.classList.add('hidden');
    }
    closeOrderSheet();
}

function renderOrderItems(orderState) {
    const itemsContainer = document.getElementById('order-items');
    const totalContainer = document.getElementById('order-total');
    
    if (!itemsContainer || !totalContainer) return;
    
    itemsContainer.innerHTML = '';
    
    let total = 0;
    
    orderState.items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'order-item';
        
        let modifiersHtml = '';
        if (item.modifiers && item.modifiers.length > 0) {
            modifiersHtml = `<div class="item-modifiers">`;
            item.modifiers.forEach(mod => {
                modifiersHtml += `<span class="modifier">• ${mod.name}</span>`;
            });
            modifiersHtml += `</div>`;
        }
        
        let notesHtml = '';
        if (item.notes) {
            notesHtml = `<div class="item-notes">Note: ${item.notes}</div>`;
        }
        
        itemDiv.innerHTML = `
            <div class="item-main">
                <span class="order-item-qty">${item.quantity}x</span>
                <span class="order-item-name">${item.name}</span>
                <span class="order-item-price">${i18n.formatPrice(item.price)}</span>
            </div>
            ${modifiersHtml}
            ${notesHtml}
        `;
        itemsContainer.appendChild(itemDiv);
        total += (item.price * item.quantity);
    });
    
    totalContainer.innerHTML = `${i18n.t('total')}: ${i18n.formatPrice(total)}`;
}

function openOrderSheet() {
    const sheet = document.getElementById('order-sheet');
    const overlay = document.getElementById('sheet-overlay');
    sheet.style.transform = '';
    sheet.classList.add('active');
    overlay.classList.add('active');
}

function closeOrderSheet() {
    document.getElementById('order-sheet').classList.remove('active');
    document.getElementById('sheet-overlay').classList.remove('active');
}

function handleSheetDrag(event) {
    const sheet = document.getElementById('order-sheet');
    const touch = event.touches[0];
    touchStartY = touch.clientY;
    
    function onTouchMove(e) {
        currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStartY;
        
        if (deltaY > 0) {
            sheet.style.transform = `translateY(${deltaY}px)`;
        }
    }
    
    function onTouchEnd() {
        const deltaY = currentY - touchStartY;
        
        if (deltaY > 100) {
            sheet.style.transform = '';
            closeOrderSheet();
        } else {
            sheet.style.transform = 'translateY(0)';
        }
        
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
    }
    
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
}

// ============================================
// EVENT LISTENERS & INITIALIZATION
// ============================================

// Initialize language toggle

// Initialize main app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Spacing adjustments
window.addEventListener('load', adjustSpacing);
window.addEventListener('resize', adjustSpacing);

// Input auto-resize on typing
const chatInput = document.getElementById('chat-input');
if (chatInput) {
    chatInput.addEventListener('input', () => {
        setTimeout(adjustSpacing, 10);
    });
}

// Better mobile handling
if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    // iOS specific adjustments if needed
}

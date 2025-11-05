// ============================================
// LANGUAGE MANAGEMENT
// ============================================

/**
 * Initialize language toggle
 */
function initLanguageToggle() {
  const langButtons = document.querySelectorAll('.lang-btn');
  
  // Set initial active state
  const currentLang = i18n.getCurrentLanguage();
  langButtons.forEach(btn => {
    if (btn.dataset.lang === currentLang) {
      btn.classList.add('active');
    }
  });
  
  // Add click handlers
  langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const newLang = btn.dataset.lang;
      
      // Don't do anything if already active
      if (btn.classList.contains('active')) return;
      
      // Switch language
      i18n.setLanguage(newLang);
      
      // Update button states
      langButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update UI text
      updateUILanguage();
    });
  });
      // Update UI text
      updateUILanguage();
      
      // Close menu if open (prevent stuck menu)
      const menuPanel = document.getElementById('menu-panel');
      const menuOverlay = document.getElementById('menu-overlay');
      if (menuPanel) menuPanel.classList.remove('active');
      if (menuOverlay) menuOverlay.classList.remove('active');
}

/**
 * Update all UI text after language change
 */
function updateUILanguage() {
  // Update menu button text only
  const menuBtn = document.querySelector('.menu-btn span');
  if (menuBtn) menuBtn.textContent = i18n.t('menu');
  
  // Update menu header (if menu is open)
  const menuPanel = document.getElementById('menu-panel');
  if (menuPanel && menuPanel.classList.contains('active')) {
    const menuHeader = document.querySelector('.menu-header h3');
    if (menuHeader) menuHeader.textContent = i18n.t('ourMenu');
    
    const searchInput = document.getElementById('menu-search');
    if (searchInput) searchInput.placeholder = i18n.t('search');
    
    // Re-render menu items if loaded
    if (window.menuData && window.menuData.length > 0) {
      const filtered = window.currentCategory === 'all' 
        ? window.menuData 
        : window.menuData.filter(item => item.category === window.currentCategory);
      displayMenuItems(filtered);
    }
  }
  
  // Update message placeholder
  const chatInput = document.getElementById('chat-input');
  if (chatInput) chatInput.placeholder = i18n.t('messagePlaceholder');
  
  // Update order sheet header (if order exists)
  if (window.currentOrderState) {
    const orderHeader = document.querySelector('.sheet-header h3');
    if (orderHeader) orderHeader.textContent = i18n.t('yourOrder');
    
    renderOrderItems(window.currentOrderState);
  }
}

// Initialize when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLanguageToggle);
} else {
  initLanguageToggle();
}

// ============================================
// ORIGINAL APP.JS CODE STARTS BELOW
// ============================================

// Configuration
const API_BASE = 'https://api.wakely.ai/api';
const N8N_WEBHOOK = 'https://n8n.wakely.ai/webhook/web-chat';

// Extract org slug from URL
const pathParts = window.location.pathname.split('/');
const orgSlug = pathParts[1];
let organizationId = null;
// Session management
let sessionId = localStorage.getItem('chat_session');
if (!sessionId) {
    sessionId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('chat_session', sessionId);
}

let organization = null;
let isSending = false;
window.window.currentOrderState = null;


// Initialize
async function init() {
    try {
        // Fetch organization details
        const response = await fetch(`${API_BASE}/public/org/${orgSlug}`);
        if (!response.ok) throw new Error('Organization not found');
        
        organization = await response.json();
        organizationId = organization.organization_id;
        document.getElementById('org-name').textContent = organization.name;
        if (organization.brand_assets) {
            const assets = organization.brand_assets;
            
            // Apply logo if exists
            const logoContainer = document.getElementById('org-logo');
            const nameContainer = document.getElementById('org-name');
            
            if (assets.logo_url && logoContainer) {
                logoContainer.src = assets.logo_url;
                logoContainer.style.display = 'block';
                logoContainer.onerror = function() {
                    // If logo fails to load, hide it and show name
                    this.style.display = 'none';
                    if (nameContainer) nameContainer.style.display = 'block';
                };
                // Hide name when logo is successfully shown
                if (nameContainer) nameContainer.style.display = 'none';
            }            
            // Apply colors if exist
            if (assets.header_color) {
                // For header and footer, we need to override bg-primary in those specific elements
                const style = document.createElement('style');
                style.innerHTML = `
                    #chat-header { background: ${assets.header_color} !important; }
                    #chat-input-container { background: ${assets.header_color} !important; }
                `;
                document.head.appendChild(style);
            }
            if (assets.bg_color) {
                // Main chat background
                document.documentElement.style.setProperty('--bg-primary', assets.bg_color);
            }
            if (assets.button_color) {
                // Send button and avatar squares
                document.documentElement.style.setProperty('--primary-color', assets.button_color);
            }
        }        

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
        addMessage('bot', i18n.t('welcome', organization.name));
        
    } catch (error) {
        console.error('Init error:', error);
        document.getElementById('org-name').textContent = i18n.t('chatService');
        addMessage('bot', i18n.t('welcomeFallback'));
    }
}

// Dynamically adjust spacing based on input height
function adjustSpacing() {
    const inputContainer = document.getElementById('chat-input-container');
    const chatMessages = document.getElementById('chat-messages');
    
    if (inputContainer && chatMessages) {
        const inputHeight = inputContainer.offsetHeight;
        chatMessages.style.paddingBottom = `${inputHeight + 20}px`;
    }
}

// Run on load and resize
window.addEventListener('load', adjustSpacing);
window.addEventListener('resize', adjustSpacing);

// Also adjust when input expands (for multiline text)
const chatInput = document.getElementById('chat-input');
if (chatInput) {
    chatInput.addEventListener('input', () => {
        setTimeout(adjustSpacing, 10);
    });
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
        console.log('Full response from n8n:', data);
        if (data.orderState) {
            window.currentOrderState = data.orderState;
            console.log('Order state updated:', window.currentOrderState);
            updateOrderPanel(window.currentOrderState);

            showMenuButton();
        }
        
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
            addMessage('bot', i18n.t('errorTimeout'));
        } else {
            addMessage('bot', i18n.t('errorGeneric'));
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
    function linkifyText(text) {
        // First escape HTML to prevent injection
        const escaped = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    
        // Then convert URLs to clickable links
        return escaped.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #007bff; text-decoration: underline;">$1</a>'
        );
    }

    // Use innerHTML for linked text
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

}
// Order Panel Management
function updateOrderPanel(orderState) {
    if (!orderState || !orderState.items || orderState.items.length === 0) {
        hideOrderIndicators();
        return;
    }
    
    // Update mobile button badge
    const itemCount = orderState.items.reduce((sum, item) => sum + item.quantity, 0);
    showOrderIndicators(itemCount);
    
    // Update panel content
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
    
    // Clear existing
    itemsContainer.innerHTML = '';
    
    let total = 0;
    
    // Add each item
    orderState.items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'order-item';
    
        // Build modifiers text if they exist
        let modifiersHtml = '';
        if (item.modifiers && item.modifiers.length > 0) {
            modifiersHtml = `<div class="item-modifiers">`;
            item.modifiers.forEach(mod => {
                modifiersHtml += `<span class="modifier">• ${mod.name}</span>`;
            });
            modifiersHtml += `</div>`;
        }
    
        // Add notes if they exist
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

// Sheet control functions
function openOrderSheet() {
    const sheet = document.getElementById('order-sheet');
    const overlay = document.getElementById('sheet-overlay');
    sheet.style.transform = '';  // Clear any inline transform
    sheet.classList.add('active');
    overlay.classList.add('active');
}

function closeOrderSheet() {
    document.getElementById('order-sheet').classList.remove('active');
    document.getElementById('sheet-overlay').classList.remove('active');
}

// Touch handling for drag-to-close
// Touch handling for swipe-to-close
let touchStartY = 0;
let currentY = 0;

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
            sheet.style.transform = '';  // Reset transform
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

// Menu Management
// Make these globally accessible for language switching
window.menuData = [];
window.currentCategory = 'all';


async function loadMenu() {
    try {
        // Change this line - add 'public' to the path
        const response = await fetch(`https://api.wakely.ai/api/public/menu/${organizationId}`);
        
        if (!response.ok) return;
        
        // IMPORTANT: The response structure is different
        const data = await response.json();
        window.menuData = data.menu;  // Extract menu from response object
        
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
        
        // Display all items initially
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
        // Use i18n helper methods
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
    
    // Update active tab
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === category);
    });
    
    // Filter items
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
    
    // Load menu if not loaded
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

// Show menu button when order starts
function showMenuButton() {
    document.getElementById('menu-btn').classList.remove('hidden');
}

// Update the existing updateOrderPanel function
const originalUpdateOrderPanel = updateOrderPanel;
updateOrderPanel = function(orderState) {
    originalUpdateOrderPanel(orderState);
    // FIXED: Show menu button when order exists (even with empty items)
    if (orderState) {
        showMenuButton();
    }
};

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
// ============================================
// MENU SYSTEM
// ============================================
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

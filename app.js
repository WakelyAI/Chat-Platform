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
    // TEST MODE: Simulate order confirmation
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test') === 'order') {
        setTimeout(() => {
            console.log('TEST MODE: Injecting fake order confirmation');
            addMessage('bot', 'Test confirmation message', {
                messageType: 'ORDER_CONFIRMATION',
                orderData: {
                    orderReference: 'TEST12345',
                    customerName: 'Ahmad Test',
                    totalAmount: 99,
                    items: [],
                    language: 'ar'
                }
            });
        }, 2000);
    }
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
                if (!isSending) handleSend();
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

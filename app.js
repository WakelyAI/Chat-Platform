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
            
            console.log('📦 Applying branding for:', organization.name);
            
            // ==========================================
            // LOGO HANDLING
            // ==========================================
            const logoContainer = document.getElementById('org-logo');
            const nameContainer = document.getElementById('org-name');
            
            if (assets.logo_url && logoContainer) {
                logoContainer.src = assets.logo_url;
                logoContainer.style.display = 'block';
                logoContainer.onerror = function() {
                    console.warn('❌ Logo failed to load');
                    this.style.display = 'none';
                    if (nameContainer) nameContainer.style.display = 'block';
                };
                if (nameContainer) nameContainer.style.display = 'none';
            }
            
            // ==========================================
            // COLORS - Support both new theme and legacy
            // ==========================================
            const theme = assets.theme || {};
            const legacy = assets._legacy || {};
            
            // Helper function
            const setColor = (cssVar, newVal, legacyVal, oldVal, fallback) => {
                const color = newVal || legacyVal || oldVal || fallback;
                if (color) {
                    document.documentElement.style.setProperty(cssVar, color);
                    console.log(`✅ ${cssVar} = ${color}`);
                    return color;
                }
                return null;
            };
            
            setColor(
                '--brand-color',
                theme.brand_color,
                legacy.button_color,
                assets.button_color,
                '#ffffff'
            );

            setColor(
                '--bg-main',
                theme.background_color,
                legacy.bg_color,
                assets.bg_color,
                '#ffffff'
            );
            
            // Header & Input container color
            const headerColor = theme.surface_color || legacy.header_color || assets.header_color;
            if (headerColor) {
                const style = document.createElement('style');
                style.innerHTML = `
                    #chat-header { background: ${headerColor} !important; }
                    #chat-input-container { background: ${headerColor} !important; }
                `;
                document.head.appendChild(style);
                console.log(`✅ Header/Input = ${headerColor}`);
            }
            
            console.log('✅ Branding applied successfully');
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

// ============================================
// CONFIGURATION & GLOBAL VARIABLES
// ============================================
const API_BASE = 'https://api.wakely.ai/api';
const API_GATEWAY_WEBHOOK = 'https://api.wakely.ai/webhook/web-chat';

// Extract org slug from URL
const pathParts = window.location.pathname.split('/').filter(p => p);
const orgSlug = pathParts[0] || null;

// Validate slug exists
if (!orgSlug || orgSlug.trim() === '') {
    document.addEventListener('DOMContentLoaded', () => {
        showErrorPage();
    });
    throw new Error('No organization slug provided');
}

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
// ERROR PAGE DISPLAY
// ============================================
function showErrorPage() {
    const container = document.getElementById('chat-container');
    if (!container) return;
    
    // Replace entire chat container with branded error page
    container.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Glacial+Indifference:wght@400;700&display=swap');
            
            #chat-container {
                font-family: 'Glacial Indifference', Arial, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #9db5a5 0%, #b8d4c5 100%);
                padding: 20px;
            }
            
            .error-card {
                background: white;
                border-radius: 30px;
                padding: 60px 40px;
                max-width: 500px;
                width: 100%;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,0.15);
                animation: fadeIn 0.5s ease-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .error-logo {
                width: 120px;
                height: 120px;
                margin: 0 auto 30px;
            }
            
            .error-title {
                font-size: 1.8em;
                color: #6b5d54;
                margin-bottom: 20px;
                font-weight: 700;
                letter-spacing: -0.02em;
            }
            
            .error-message {
                font-size: 1.1em;
                color: #666;
                line-height: 1.8;
                margin-bottom: 30px;
            }
            
            .error-hint {
                background: #f5f0e8;
                border-left: 4px solid #9db5a5;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 30px;
                text-align: left;
            }
            
            .error-hint-title {
                color: #9db5a5;
                font-weight: 700;
                font-size: 0.9em;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                margin-bottom: 10px;
            }
            
            .error-hint-text {
                color: #666;
                font-size: 0.95em;
                line-height: 1.6;
            }
            
            .error-button {
                background: #9db5a5;
                color: white;
                border: none;
                padding: 15px 35px;
                border-radius: 12px;
                font-size: 1em;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: 'Glacial Indifference', Arial, sans-serif;
                letter-spacing: 0.02em;
            }
            
            .error-button:hover {
                background: #8aa394;
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(157, 181, 165, 0.4);
            }
            
            .error-footer {
                margin-top: 40px;
                padding-top: 30px;
                border-top: 1px solid #f5f0e8;
                color: #9db5a5;
                font-size: 0.85em;
                letter-spacing: 0.05em;
            }
 
            .error-footer strong {
                font-weight: 700;
                color: #6b5d54;
            }
            
            @media (max-width: 600px) {
                .error-card {
                    padding: 40px 30px;
                }
                
                .error-title {
                    font-size: 1.5em;
                }
                
                .error-message {
                    font-size: 1em;
                }
            }
        </style>
        
        <div class="error-card">
            <!-- Wakely Logo (SVG inline) -->
            <svg class="error-logo" width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <svg x="17.5" y="17.5" width="65" height="65" viewBox="0 0 60 60" fill="none">
                    <circle cx="30" cy="30" r="20" stroke="#9db5a5" stroke-width="2.5"/>
                    <circle cx="30" cy="30" r="15" stroke="#9db5a5" stroke-width="1.8"/>
                    <circle cx="30" cy="30" r="2.8" fill="#9db5a5"/>
                    <circle cx="22.5" cy="30" r="1.8" fill="#9db5a5"/>
                    <circle cx="37.5" cy="30" r="1.8" fill="#9db5a5"/>
                    <circle cx="30" cy="22.5" r="1.8" fill="#9db5a5"/>
                    <circle cx="30" cy="37.5" r="1.8" fill="#9db5a5"/>
                </svg> 
            </svg>
            
            <h1 class="error-title">This page doesn't exist</h1>
            
            <p class="error-message">
                The link you're trying to access is not available.<br>
                Please check the URL and try again.
            </p>
            
            <div class="error-hint">
                <div class="error-hint-title">💡 Need Help?</div>
                <div class="error-hint-text">
                    Make sure you have the correct chat link from the business you're trying to reach.
                </div>
            </div>
            
            <button class="error-button" onclick="window.location.reload()">
                Try Again
            </button>
        
        <div class="error-footer">
            Powered by <strong>wakely.ai</strong>
        </div>
    </div> 
  `;
}

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
        if (!response.ok) {
            if (response.status === 404) {
                showErrorPage();
            }
            throw new Error('Organization not found');
        }
        
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

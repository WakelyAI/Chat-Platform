/**
 * Application Configuration
 * All constants and environment-specific settings
 * 
 * @version 1.0.0
 * @module config
 */

const CONFIG = {
  // API Endpoints
  API: {
    BASE: 'https://api.wakely.ai/api',
    N8N_WEBHOOK: 'http://207.154.195.67:3500/webhook/web-chat',
    MENU_ENDPOINT: 'https://api.wakely.ai/api/public/menu'
  },
  
  // Timeouts (milliseconds)
  TIMEOUTS: {
    MESSAGE_SEND: 30000,      // 30 seconds
    TYPING_INDICATOR: 500,     // 0.5 seconds
    DEBOUNCE: 300             // 0.3 seconds
  },
  
  // UI Settings
  UI: {
    TEXTAREA_MAX_HEIGHT: 120,
    MENU_PANEL_WIDTH: '400px',
    ANIMATION_DURATION: 300
  },
  
  // Feature Flags
  FEATURES: {
    LANGUAGE_TOGGLE: true,
    ORDER_SHEET: true,
    MENU_PANEL: true,
    VOICE_INPUT: false,      // Future feature
    DARK_MODE: false,         // Future feature
    ORDER_CONFIRMATION_CARD: true  // Visual order confirmation - starts OFF
  },
  
  // Localization
  LOCALE: {
    DEFAULT_LANGUAGE: 'ar',  // Saudi market default
    SUPPORTED_LANGUAGES: ['en', 'ar'],
    CURRENCY: {
      en: 'SAR',
      ar: 'ر.س'
    },
    DATE_FORMAT: {
      en: 'MM/DD/YYYY',
      ar: 'DD/MM/YYYY'
    }
  },
  
  // Storage Keys
  STORAGE_KEYS: {
    SESSION_ID: 'chat_session',
    LANGUAGE: 'preferred_language',
    USER_PREFERENCES: 'user_prefs',
    LAST_ORDER: 'last_confirmed_order'

  },
  
  // Session
  SESSION: {
    PREFIX: 'web',
    ID_LENGTH: 9
  }
};

// Freeze to prevent modifications
Object.freeze(CONFIG);

// Export for module use (future-proof)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}

// Global access (current architecture)
window.CONFIG = CONFIG;

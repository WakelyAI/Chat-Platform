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
    API_GATEWAY_WEBHOOK: 'https://api.wakely.ai/webhook/web-chat',
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
    LAST_ORDER: 'last_confirmed_order',
    SUGGESTIONS_DISMISSED: 'suggestions_dismissed'


  },
  
  // Session
  SESSION: {
    PREFIX: 'web',
    ID_LENGTH: 9
  },
  // Default Suggestion Templates (by business type)
  SUGGESTIONS: {
    restaurant: [
      { icon: '🛒', text_en: "I'd like to order", text_ar: 'أبي أطلب' },
      { icon: '📋', text_en: 'Show me the menu', text_ar: 'وريني المنيو' },
      { icon: '⏰', text_en: 'Are you open now?', text_ar: 'مفتوحين الحين؟' },
      { icon: '📍', text_en: 'Where are you located?', text_ar: 'وين موقعكم؟' }
    ],
    hotel: [
      { icon: '🛏️', text_en: 'Book a room', text_ar: 'أبي أحجز غرفة' },
      { icon: '💰', text_en: 'Room types & prices', text_ar: 'أنواع الغرف والأسعار' },
      { icon: '⏰', text_en: 'Check-in/out times', text_ar: 'أوقات الدخول والخروج' },
      { icon: '🏊', text_en: 'Hotel amenities', text_ar: 'مرافق الفندق' }
    ],
    spa: [
      { icon: '📅', text_en: 'Book an appointment', text_ar: 'أبي أحجز موعد' },
      { icon: '💆', text_en: 'Services & prices', text_ar: 'الخدمات والأسعار' },
      { icon: '⏰', text_en: 'Working hours', text_ar: 'أوقات العمل' },
      { icon: '📍', text_en: 'Your location', text_ar: 'موقعكم' }
    ],
    default: [
      { icon: '💬', text_en: 'I have a question', text_ar: 'عندي سؤال' },
      { icon: '⏰', text_en: 'Working hours', text_ar: 'أوقات العمل' },
      { icon: '📍', text_en: 'Your location', text_ar: 'موقعكم' },
      { icon: '📞', text_en: 'Contact info', text_ar: 'معلومات التواصل' }
    ]
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

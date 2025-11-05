/**
 * Internationalization Module
 * Handles all translations and language switching
 * 
 * @version 1.0.0
 * @module i18n
 */

/**
 * Translation dictionary
 * Add new keys here for any user-facing text
 */
const translations = {
  en: {
    // Header
    loading: 'Loading...',
    
    // Menu
    menu: 'Menu',
    ourMenu: 'Our Menu',
    search: 'Search menu...',
    all: 'All',
    close: '✕',
    
    // Chat
    messagePlaceholder: 'Message...',
    you: 'You',
    assistant: 'Assistant',
    typing: 'Typing...',
    
    // Welcome messages
    welcome: (name) => `Welcome to ${name}! How can I help you today?`,
    welcomeFallback: 'Welcome! How can I help you?',
    
    // Errors
    errorGeneric: 'Sorry, I encountered an error. Please try again.',
    errorTimeout: 'The request timed out. Please try again.',
    errorNetwork: 'Network error. Please check your connection.',
    errorInit: 'Failed to load. Please refresh the page.',
    
    // Order
    yourOrder: 'Your Order',
    total: 'Total',
    note: 'Note',
    
    // Menu actions
    tellMeAbout: (item) => `Tell me about ${item}`,
    
    // Loading states
    loadingMenu: 'Loading menu...',
    noItems: 'No items found',
    
    // Misc
    chatService: 'Chat Service'
  },
  
  ar: {
    // Header
    loading: 'جاري التحميل...',
    
    // Menu
    menu: 'القائمة',
    ourMenu: 'قائمتنا',
    search: 'ابحث في القائمة...',
    all: 'الكل',
    close: '✕',
    
    // Chat
    messagePlaceholder: 'رسالة...',
    you: 'أنت',
    assistant: 'المساعد',
    typing: 'يكتب...',
    
    // Welcome messages
    welcome: (name) => `مرحباً بك في ${name}! كيف يمكنني مساعدتك اليوم؟`,
    welcomeFallback: 'مرحباً! كيف يمكنني مساعدتك؟',
    
    // Errors
    errorGeneric: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.',
    errorTimeout: 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.',
    errorNetwork: 'خطأ في الشبكة. يرجى التحقق من اتصالك.',
    errorInit: 'فشل التحميل. يرجى تحديث الصفحة.',
    
    // Order
    yourOrder: 'طلبك',
    total: 'الإجمالي',
    note: 'ملاحظة',
    
    // Menu actions
    tellMeAbout: (item) => `أخبرني عن ${item}`,
    
    // Loading states
    loadingMenu: 'جاري تحميل القائمة...',
    noItems: 'لا توجد عناصر',
    
    // Misc
    chatService: 'خدمة الدردشة'
  }
};

/**
 * I18n Manager Class
 * Handles language detection, switching, and translation
 */
class I18n {
  constructor() {
    this.translations = translations;
    this.currentLang = this.detectLanguage();
    this.init();
  }
  
  /**
   * Initialize i18n
   */
  init() {
    // Set HTML attributes
    this.applyLanguageAttributes();
    
    // Listen for language change events
    this.setupEventListeners();
  }
  
  /**
   * Detect preferred language
   * Priority: localStorage > browser > default
   */
  detectLanguage() {
    // 1. Check localStorage (user's explicit choice)
    const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.LANGUAGE);
    if (saved && CONFIG.LOCALE.SUPPORTED_LANGUAGES.includes(saved)) {
      return saved;
    }
    
    // 2. Detect from browser
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('ar')) {
      return 'ar';
    }
    if (browserLang.startsWith('en')) {
      return 'en';
    }
    
    // 3. Use default (Arabic for Saudi market)
    return CONFIG.LOCALE.DEFAULT_LANGUAGE;
  }
  
  /**
   * Apply language attributes to HTML
   */
  applyLanguageAttributes() {
    const html = document.documentElement;
    html.setAttribute('lang', this.currentLang);
    // html.setAttribute('dir', this.currentLang === 'ar' ? 'rtl' : 'ltr');
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for custom language change events
    window.addEventListener('languageChanged', (e) => {
      this.applyLanguageAttributes();
    });
  }
  
  /**
   * Get translation for key
   * @param {string} key - Translation key
   * @param {...any} args - Arguments for function translations
   * @returns {string} Translated text
   */
  t(key, ...args) {
    const translation = this.translations[this.currentLang]?.[key];
    
    // Handle missing translations
    if (!translation) {
      console.warn(`Missing translation for key: ${key} (${this.currentLang})`);
      return key;
    }
    
    // Handle function translations (e.g., welcome message with name)
    if (typeof translation === 'function') {
      return translation(...args);
    }
    
    // Return string translation
    return translation;
  }
  
  /**
   * Switch language
   * @param {string} lang - Language code ('en' or 'ar')
   */
  setLanguage(lang) {
    if (!CONFIG.LOCALE.SUPPORTED_LANGUAGES.includes(lang)) {
      console.error(`Unsupported language: ${lang}`);
      return;
    }
    
    this.currentLang = lang;
    
    // Save to localStorage
    localStorage.setItem(CONFIG.STORAGE_KEYS.LANGUAGE, lang);
    
    // Update HTML attributes
    this.applyLanguageAttributes();
    
    // Dispatch event for components to update
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { lang } 
    }));
  }
  
  /**
   * Get current language
   * @returns {string} Current language code
   */
  getCurrentLanguage() {
    return this.currentLang;
  }
  
  /**
   * Check if current language is RTL
   * @returns {boolean}
   */
  isRTL() {
    return this.currentLang === 'ar';
  }
  
  /**
   * Format price with currency
   * @param {number} price - Price value
   * @returns {string} Formatted price
   */
  formatPrice(price) {
    const currency = CONFIG.LOCALE.CURRENCY[this.currentLang];
    return `${price} ${currency}`;
  }
  
  /**
   * Get item name based on language
   * @param {object} item - Menu item
   * @returns {string} Item name in current language
   */
  getItemName(item) {
    if (this.currentLang === 'ar' && item.name_ar) {
      return item.name_ar;
    }
    return item.name;
  }
  
  /**
   * Get item description based on language
   * @param {object} item - Menu item
   * @returns {string} Item description in current language
   */
  getItemDescription(item) {
    if (this.currentLang === 'ar' && item.description_ar) {
      return item.description_ar;
    }
    return item.description || '';
  }
}

// Create global instance
window.i18n = new I18n();

// Export for module use (future-proof)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18n;
}

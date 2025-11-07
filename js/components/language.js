/**
 * Language Module
 * Handles language toggle and UI translations
 */

function initLanguageToggle() {
    const toggleBtn = document.getElementById('language-toggle');
    if (!toggleBtn) return;
    
    // Set initial text based on current language
    const currentLang = i18n.getCurrentLanguage();
    toggleBtn.textContent = currentLang.toUpperCase();
    
    // Single click handler to toggle between languages
    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const currentLang = i18n.getCurrentLanguage();
        const newLang = currentLang === 'en' ? 'ar' : 'en';
        
        i18n.setLanguage(newLang);
        toggleBtn.textContent = newLang.toUpperCase();
        updateUILanguage();
    });
}

function updateUILanguage() {
    // Update message input placeholder
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.placeholder = i18n.t('messagePlaceholder');
    }
    
    // Update menu button text
    const menuBtn = document.querySelector('.menu-btn span');
    if (menuBtn) {
        menuBtn.textContent = i18n.t('menu');
    }
    
    // Update menu panel content
    const menuPanel = document.getElementById('menu-panel');
    if (menuPanel) {
        const menuHeader = document.querySelector('.menu-header h3');
        if (menuHeader) {
            menuHeader.textContent = i18n.t('ourMenu');
        }
        
        const searchInput = document.getElementById('menu-search');
        if (searchInput) {
            searchInput.placeholder = i18n.t('search');
        }

        const loadingDiv = document.querySelector('.menu-loading');
        if (loadingDiv) {
            loadingDiv.textContent = i18n.t('loadingMenu');
        }

        // Re-render menu items if loaded
        if (window.menuData && window.menuData.length > 0) {
            const filtered = window.currentCategory === 'all' 
                ? window.menuData 
                : window.menuData.filter(item => item.category === window.currentCategory);
            
            if (typeof displayMenuItems === 'function') {
                displayMenuItems(filtered);
            }
        }
    }
    
    // Update order panel if visible
    if (window.currentOrderState && window.currentOrderState.items) {
        const orderHeader = document.querySelector('.sheet-header h3');
        if (orderHeader) {
            orderHeader.textContent = i18n.t('yourOrder');
        }
        
        if (typeof renderOrderItems === 'function') {
            renderOrderItems(window.currentOrderState);
        }
    }
}

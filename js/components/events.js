/**
 * Event Listeners Module
 * Centralizes all event listener attachments
 */

function initializeEventListeners() {
    // Menu button
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
        menuBtn.onclick = null; // Remove inline handler
        menuBtn.addEventListener('click', toggleMenu);
    }

    // Send button
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
        sendBtn.onclick = null; // Remove inline handler
        sendBtn.addEventListener('click', sendMessage);
    }

    // Menu overlay
    const menuOverlay = document.getElementById('menu-overlay');
    if (menuOverlay) {
        menuOverlay.onclick = null; // Remove inline handler
        menuOverlay.addEventListener('click', closeMenu);
    }

    // Menu close button
    const menuClose = document.querySelector('.menu-close');
    if (menuClose) {
        menuClose.onclick = null; // Remove inline handler
        menuClose.addEventListener('click', closeMenu);
    }

    // Menu search
    const menuSearch = document.getElementById('menu-search');
    if (menuSearch) {
        menuSearch.onkeyup = null; // Remove inline handler
        menuSearch.addEventListener('keyup', searchMenu);
    }

    // Mobile order button
    const mobileOrderBtn = document.getElementById('mobile-order-btn');
    if (mobileOrderBtn) {
        mobileOrderBtn.onclick = null; // Remove inline handler
        mobileOrderBtn.addEventListener('click', openOrderSheet);
    }

    // Sheet overlay
    const sheetOverlay = document.getElementById('sheet-overlay');
    if (sheetOverlay) {
        sheetOverlay.onclick = null; // Remove inline handler
        sheetOverlay.addEventListener('click', closeOrderSheet);
    }
}

// Initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEventListeners);
} else {
    initializeEventListeners();
}

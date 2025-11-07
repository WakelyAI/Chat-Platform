/**
 * Menu Module
 * Handles menu display, search, and filtering
 */

async function loadMenu() {
    try {
        const response = await fetch(`https://api.wakely.ai/api/public/menu/${organizationId}`);
        
        if (!response.ok) return;
        
        const data = await response.json();
        window.menuData = data.menu;
        
        // Extract unique categories
        const categories = [...new Set(window.menuData.map(item => item.category))].filter(Boolean);
        
        // Build category tabs WITHOUT onclick
        const categoryHtml = `
            <button class="category-tab active" data-category="all">All</button>
            ${categories.map(cat => 
                `<button class="category-tab" data-category="${cat}">${cat}</button>`
            ).join('')}
        `;
        document.getElementById('menu-categories').innerHTML = categoryHtml;
        
        // Add event listeners to category buttons using delegation
        const menuCategories = document.getElementById('menu-categories');
        menuCategories.addEventListener('click', function(e) {
            if (e.target.classList.contains('category-tab')) {
                filterCategory(e.target.dataset.category);
            }
        });
        
        // Display all items
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
    
    // Build items WITHOUT onclick
    container.innerHTML = items.map(item => {
        const itemName = i18n.getItemName(item);
        const itemDesc = i18n.getItemDescription(item);
        
        return `
            <div class="menu-item" data-item-name="${item.name}">
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
    
    // Add event listener for menu items using delegation
    if (!container.dataset.listenerAdded) {
        container.addEventListener('click', function(e) {
            const menuItem = e.target.closest('.menu-item');
            if (menuItem) {
                const itemName = menuItem.dataset.itemName;
                askAboutItem(itemName);
            }
        });
        container.dataset.listenerAdded = 'true';
    }
}

function filterCategory(category) {
    window.currentCategory = category;
    
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === category);
    });
    
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

function showMenuButton() {
    document.getElementById('menu-btn').classList.remove('hidden');
}

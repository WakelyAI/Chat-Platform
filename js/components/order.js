/**
 * Order Module
 * Handles order display and management
 */

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

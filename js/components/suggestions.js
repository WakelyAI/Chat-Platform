/**
 * Suggestions Module
 * Shows contextual quick-action text suggestions based on business type
 */

/**
 * Get suggestion chips for an organization
 * Priority: custom config > defaults by business_type
 */
function getSuggestionChips(org) {
  // 1. Custom chips from chat_config
  if (org.chat_config?.suggestions?.enabled === true && org.chat_config?.suggestions?.chips) {
    console.log('📌 Using custom suggestion chips');
    return org.chat_config.suggestions.chips;
  }
  
  // 2. Explicitly disabled
  if (org.chat_config?.suggestions?.enabled === false) {
    console.log('📌 Suggestions disabled for this org');
    return null;
  }
  
  // 3. Defaults by business_type
  const businessType = org.business_type || 'restaurant';
  const defaults = CONFIG.SUGGESTIONS[businessType] || CONFIG.SUGGESTIONS.default;
  
  console.log(`📌 Using default suggestions for: ${businessType}`);
  return defaults;
}

/**
 * Check if suggestions should show (session-based)
 */
function shouldShowSuggestions() {
  return !sessionStorage.getItem(CONFIG.STORAGE_KEYS.SUGGESTIONS_DISMISSED);
}

/**
 * Mark suggestions as dismissed for this session
 */
function dismissSuggestions() {
  sessionStorage.setItem(CONFIG.STORAGE_KEYS.SUGGESTIONS_DISMISSED, 'true');
}

/**
 * Render suggestions in the chat
 */
function showSuggestions(org) {
  if (!shouldShowSuggestions()) {
    console.log('📌 Suggestions already dismissed');
    return;
  }
  
  const chips = getSuggestionChips(org);
  if (!chips || chips.length === 0) {
    console.log('📌 No suggestions to show');
    return;
  }
  
  const messagesDiv = document.getElementById('chat-messages');
  const currentLang = i18n.getCurrentLanguage();
  
  // Create container
  const container = document.createElement('div');
  container.id = 'suggestions-container';
  container.className = 'suggestions-container';
  
  // Label
  const label = document.createElement('div');
  label.className = 'suggestions-label';
  label.textContent = i18n.t('tryAsking');
  container.appendChild(label);
  
  // Suggestions list
  const list = document.createElement('div');
  list.className = 'suggestions-list';
  
  chips.forEach(chip => {
    const text = currentLang === 'ar' ? chip.text_ar : chip.text_en;
    
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.textContent = `"${text}"`;
    
    item.addEventListener('click', () => {
      // Put text in input and send
      const input = document.getElementById('chat-input');
      input.value = text;
      handleSend();
      
      // Remove suggestions
      removeSuggestions();
    });
    
    list.appendChild(item);
  });
  
  container.appendChild(list);
  messagesDiv.appendChild(container);
  
  // Scroll to show
  requestAnimationFrame(() => {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
  
  console.log('📌 Suggestions displayed');
}

/**
 * Remove suggestions from DOM
 */
function removeSuggestions() {
  const container = document.getElementById('suggestions-container');
  if (container) {
    container.classList.add('suggestions-hiding');
    setTimeout(() => container.remove(), 300);
  }
  dismissSuggestions();
}

// Make globally available
window.showSuggestions = showSuggestions;
window.removeSuggestions = removeSuggestions;

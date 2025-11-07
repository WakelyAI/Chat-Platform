/**
 * API Service Module
 * Centralizes all API calls with proper error handling
 * Uses CONFIG from config.js for all endpoints
 */

const ApiService = {
    // Fetch organization details
    async fetchOrganization(orgSlug) {
        try {
            const response = await fetch(`${CONFIG.API.BASE}/public/org/${orgSlug}`);
            if (!response.ok) {
                throw new Error(`Failed to load organization: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Organization fetch error:', error);
            throw error;
        }
    },

    // Send chat message
    async sendChatMessage(message, sessionId, organization) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUTS.MESSAGE_SEND);
            
            const response = await fetch(CONFIG.API.N8N_WEBHOOK, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    userId: sessionId,
                    whatsapp_number: organization?.whatsapp_number || '',
                    channel: 'web'
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Message send failed: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('timeout');
            }
            throw error;
        }
    },

    // Load menu  
    async loadMenu(organizationId) {
        try {
            const response = await fetch(`${CONFIG.API.MENU_ENDPOINT}/${organizationId}`);
            if (!response.ok) {
                throw new Error(`Menu load failed: ${response.status}`);
            }
            const data = await response.json();
            return data.menu || [];
        } catch (error) {
            console.error('Menu load error:', error);
            return []; // Return empty array on error
        }
    }
};

// Make it globally available
window.ApiService = ApiService;

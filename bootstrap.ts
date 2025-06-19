import { getTrackerConfig, type TrackerConfig } from './config';
import { checkConsent, type ConsentStatus } from './consent';
import { initAttribution, type AttributionData } from './attribution';
import { trackForms } from './forms';

declare global {
    interface Window {
        __LEADLOOPR_INITIALIZED__?: boolean;
    }
}

async function initialize(config: TrackerConfig): Promise<void> {
    if (config.debug) {
        console.log('LeadLoopr: Starting initialization');
    }

    // Check consent before proceeding
    const consent = await checkConsent(config);
    if (!consent.granted) {
        if (config.debug) {
            console.log('LeadLoopr: Consent not granted, reason:', consent.reason);
        }
        return;
    }

    // Initialize attribution (doesn't require consent)
    const attribution = initAttribution(config);

    // Initialize form tracking with attribution data and consent status
    trackForms(config, attribution, consent);

    if (config.debug) {
        console.log('LeadLoopr: Initialization complete');
    }
}

export function bootstrap(): void {
    // Prevent double initialization
    if (window.__LEADLOOPR_INITIALIZED__) {
        console.warn('LeadLoopr: Script already initialized');
        return;
    }

    // Function to handle initialization
    const init = async () => {
        try {
            const config = getTrackerConfig();
            await initialize(config);
            window.__LEADLOOPR_INITIALIZED__ = true;
        } catch (error) {
            console.error('LeadLoopr: Initialization failed:', error);
        }
    };

    // Check if DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}

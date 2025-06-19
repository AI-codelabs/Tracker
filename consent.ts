import type { TrackerConfig } from './config';

declare global {
    interface Window {
        gtag?: (
            command: string,
            action: string,
            callback?: (consent: Record<string, string>) => void
        ) => void;
    }
}

export type ConsentReason =
    | 'google-consent'
    | 'fallback-cookie'
    | 'fallback-localStorage'
    | 'none';

export interface ConsentStatus {
    granted: boolean;
    reason: ConsentReason;
}

const CONSENT_COOKIE = 'cookie_consent';
const CONSENT_STORAGE_KEY = 'leadloopr_consent';

function checkGoogleConsent(): Promise<ConsentStatus> {
    return new Promise((resolve) => {
        if (typeof window.gtag !== 'function') {
            resolve({ granted: false, reason: 'none' });
            return;
        }

        window.gtag('consent', 'get', (consent) => {
            const isGranted =
                consent?.ad_storage === 'granted' ||
                consent?.analytics_storage === 'granted' ||
                consent?.functionality_storage === 'granted';

            resolve({
                granted: isGranted,
                reason: isGranted ? 'google-consent' : 'none',
            });
        });
    });
}

function checkCookieConsent(): ConsentStatus {
    const cookies = document.cookie.split(';');
    const hasConsent = cookies.some((cookie) =>
        cookie.trim().startsWith(`${CONSENT_COOKIE}=true`)
    );

    return {
        granted: hasConsent,
        reason: hasConsent ? 'fallback-cookie' : 'none',
    };
}

function checkLocalStorageConsent(): ConsentStatus {
    const hasConsent = localStorage.getItem(CONSENT_STORAGE_KEY) === 'true';
    return {
        granted: hasConsent,
        reason: hasConsent ? 'fallback-localStorage' : 'none',
    };
}

export async function checkConsent(config: TrackerConfig): Promise<ConsentStatus> {
    if (config.debug) {
        console.log('LeadLoopr: Checking consent status...');
    }

    // First try Google Consent Mode
    const googleConsent = await checkGoogleConsent();
    if (googleConsent.granted) {
        if (config.debug) {
            console.log('LeadLoopr: Consent granted via Google Consent Mode');
        }
        return googleConsent;
    }

    // Check if consent fallback is enabled
    if (!config.featureFlags.allowConsentFallback) {
        if (config.debug) {
            console.log('LeadLoopr: Consent fallback disabled, no consent granted');
        }
        return { granted: false, reason: 'none' };
    }

    // Then try cookie fallback
    const cookieConsent = checkCookieConsent();
    if (cookieConsent.granted) {
        if (config.debug) {
            console.log('LeadLoopr: Consent granted via cookie');
        }
        return cookieConsent;
    }

    // Finally try localStorage fallback
    const storageConsent = checkLocalStorageConsent();
    if (storageConsent.granted) {
        if (config.debug) {
            console.log('LeadLoopr: Consent granted via localStorage');
        }
        return storageConsent;
    }

    if (config.debug) {
        console.log('LeadLoopr: No consent granted');
    }
    return { granted: false, reason: 'none' };
} 
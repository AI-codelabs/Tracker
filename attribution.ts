import type { TrackerConfig } from './config';

export interface AttributionData {
    landing_page: string;
    referrer?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    gclid?: string;
    fbclid?: string;
    li_fat_id?: string;
    timestamp: number;
}

const UTM_PARAMS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
] as const;

const CLICK_IDS = ['gclid', 'fbclid', 'li_fat_id'] as const;

const SESSION_STORAGE_KEY = 'leadloopr_attribution';

function getCanonicalUrl(): string {
    try {
        // Try to get canonical URL first
        const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
        if (canonical?.href) {
            return canonical.href;
        }

        // Fallback to current URL
        return window.location.href;
    } catch (error) {
        // Fallback to current URL if anything fails
        return window.location.href;
    }
}

function parseQueryParams(url: string): Record<string, string> {
    const params: Record<string, string> = {};

    try {
        const urlObj = new URL(url);
        const searchParams = urlObj.searchParams;

        // Parse UTM parameters
        UTM_PARAMS.forEach((param) => {
            const value = searchParams.get(param);
            if (value && value.trim()) {
                params[param] = value.trim();
            }
        });

        // Parse click IDs
        CLICK_IDS.forEach((id) => {
            const value = searchParams.get(id);
            if (value && value.trim()) {
                params[id] = value.trim();
            }
        });

    } catch (error) {
        // Silently fail and return empty params
        console.warn('LeadLoopr: Failed to parse URL parameters:', error);
    }

    return params;
}

function getReferrer(): string | undefined {
    try {
        const referrer = document.referrer;

        // Only return if it's not empty and not from the same domain
        if (referrer && referrer.trim() && !referrer.startsWith(window.location.origin)) {
            return referrer.trim();
        }

        return undefined;
    } catch (error) {
        console.warn('LeadLoopr: Failed to get referrer:', error);
        return undefined;
    }
}

function getCachedAttribution(): AttributionData | null {
    try {
        const cached = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (error) {
        console.warn('LeadLoopr: Failed to read cached attribution:', error);
    }
    return null;
}

function cacheAttribution(attribution: AttributionData): void {
    try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(attribution));
    } catch (error) {
        console.warn('LeadLoopr: Failed to cache attribution:', error);
    }
}

function validateAttributionData(data: AttributionData): boolean {
    return (
        typeof data.landing_page === 'string' &&
        data.landing_page.length > 0 &&
        typeof data.timestamp === 'number' &&
        data.timestamp > 0
    );
}

export function initAttribution(config: TrackerConfig): AttributionData {
    if (config.debug) {
        console.log('LeadLoopr: Initializing attribution tracking');
    }

    // Check for cached attribution first
    const cached = getCachedAttribution();
    if (cached && validateAttributionData(cached)) {
        if (config.debug) {
            console.log('LeadLoopr: Using cached attribution data');
        }
        return cached;
    }

    // Generate new attribution data
    const landingPage = getCanonicalUrl();
    const params = parseQueryParams(landingPage);
    const referrer = getReferrer();

    const attribution: AttributionData = {
        landing_page: landingPage,
        referrer,
        ...params,
        timestamp: Date.now(),
    };

    // Validate the generated data
    if (!validateAttributionData(attribution)) {
        if (config.debug) {
            console.warn('LeadLoopr: Generated invalid attribution data, using fallback');
        }
        // Fallback to minimal valid data
        attribution.landing_page = window.location.href;
        attribution.timestamp = Date.now();
    }

    // Cache the attribution data
    cacheAttribution(attribution);

    if (config.debug) {
        console.log('LeadLoopr: Attribution data captured:', {
            landing_page: attribution.landing_page,
            referrer: attribution.referrer,
            utm_params: {
                utm_source: attribution.utm_source,
                utm_medium: attribution.utm_medium,
                utm_campaign: attribution.utm_campaign,
                utm_term: attribution.utm_term,
                utm_content: attribution.utm_content,
            },
            click_ids: {
                gclid: attribution.gclid,
                fbclid: attribution.fbclid,
                li_fat_id: attribution.li_fat_id,
            },
            timestamp: attribution.timestamp,
        });
    }

    return attribution;
} 
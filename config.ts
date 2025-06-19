declare global {
    interface Window {
        LEADLOOPR_DEBUG?: boolean;
    }
}

export interface FeatureFlags {
    allowConsentFallback?: boolean;
    allowDynamicForms?: boolean;
}

export interface TrackerConfig {
    orgId: string;
    debug: boolean;
    endpoint: string;
    featureFlags: FeatureFlags;
}

const SCRIPT_ID = 'leadloopr-tracker';
const REQUIRED_ATTR = 'data-org-id';
const DEBUG_ATTR = 'data-debug';
const ENDPOINT_ATTR = 'data-endpoint';
const FEATURE_FLAGS_ATTR = 'data-feature-flags';

const DEFAULT_ENDPOINT = 'https://api.leadloopr.com/track/lead';
const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
    allowConsentFallback: true,
    allowDynamicForms: true,
};

function findTrackerScript(): HTMLScriptElement | null {
    // First try to find by ID
    const scriptById = document.getElementById(SCRIPT_ID) as HTMLScriptElement;
    if (scriptById?.tagName === 'SCRIPT') return scriptById;

    // Then try to find by src containing our filename
    const scriptBySrc = Array.from(document.getElementsByTagName('script')).find(
        (script) => script.src.includes('leadloopr-tracker.js')
    );
    return scriptBySrc as HTMLScriptElement || null;
}

function getRequiredOrgId(script: HTMLScriptElement): string {
    const orgId = script.getAttribute(REQUIRED_ATTR);
    if (!orgId || orgId.trim() === '') {
        throw new Error(
            `LeadLoopr: Missing required attribute "${REQUIRED_ATTR}" on script tag. ` +
            `Please add data-org-id="your-organization-id" to the script tag.`
        );
    }
    return orgId.trim();
}

function getDebugMode(script: HTMLScriptElement): boolean {
    const debugAttr = script.getAttribute(DEBUG_ATTR);
    const windowDebug = window.LEADLOOPR_DEBUG;

    // Check script attribute first, then window flag
    if (debugAttr !== null) {
        return debugAttr === 'true' || debugAttr === '1';
    }

    return windowDebug === true;
}

function getEndpoint(script: HTMLScriptElement): string {
    const endpoint = script.getAttribute(ENDPOINT_ATTR);
    return endpoint?.trim() || DEFAULT_ENDPOINT;
}

function parseFeatureFlags(script: HTMLScriptElement): FeatureFlags {
    const flagsAttr = script.getAttribute(FEATURE_FLAGS_ATTR);
    if (!flagsAttr) return DEFAULT_FEATURE_FLAGS;

    try {
        const parsed = JSON.parse(flagsAttr);
        return {
            allowConsentFallback: parsed.allowConsentFallback ?? DEFAULT_FEATURE_FLAGS.allowConsentFallback,
            allowDynamicForms: parsed.allowDynamicForms ?? DEFAULT_FEATURE_FLAGS.allowDynamicForms,
        };
    } catch (error) {
        console.warn('LeadLoopr: Invalid feature flags JSON, using defaults:', error);
        return DEFAULT_FEATURE_FLAGS;
    }
}

function validateConfig(config: TrackerConfig): void {
    if (!config.orgId || config.orgId.trim() === '') {
        throw new Error('LeadLoopr: Organization ID cannot be empty');
    }

    if (!config.endpoint || config.endpoint.trim() === '') {
        throw new Error('LeadLoopr: Endpoint cannot be empty');
    }

    // Validate endpoint format
    try {
        new URL(config.endpoint);
    } catch {
        throw new Error(`LeadLoopr: Invalid endpoint URL: ${config.endpoint}`);
    }
}

export function getTrackerConfig(): TrackerConfig {
    const script = findTrackerScript();

    if (!script) {
        throw new Error(
            'LeadLoopr: Could not find tracker script tag. ' +
            'Make sure the script has id="leadloopr-tracker" or src contains "leadloopr-tracker.js"'
        );
    }

    const config: TrackerConfig = {
        orgId: getRequiredOrgId(script),
        debug: getDebugMode(script),
        endpoint: getEndpoint(script),
        featureFlags: parseFeatureFlags(script),
    };

    // Validate the complete config
    validateConfig(config);

    if (config.debug) {
        console.log('LeadLoopr: Config loaded successfully:', {
            orgId: config.orgId,
            debug: config.debug,
            endpoint: config.endpoint,
            featureFlags: config.featureFlags,
        });
    }

    return config;
}

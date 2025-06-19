import type { ConsentStatus } from './consent';

// Fields that contain PII and require consent
const PII_FIELDS = [
    'name',
    'full_name',
    'first_name',
    'last_name',
    'email',
    'user_email',
    'phone',
    'tel',
    'telephone',
    'mobile',
    'cell',
] as const;

export interface FilteredFormData {
    data: Record<string, string>;
    excluded: string[];
}

function isPIIField(key: string): boolean {
    const normalizedKey = key.toLowerCase().replace(/[_-]/g, '');
    return PII_FIELDS.some((field) =>
        normalizedKey.includes(field.toLowerCase().replace(/[_-]/g, ''))
    );
}

export function filterFormDataForConsent(
    rawData: Record<string, string | undefined>,
    consent: ConsentStatus,
    debug = false
): FilteredFormData {
    if (debug) {
        console.log('LeadLoopr: Filtering form data for consent:', {
            consent,
            rawData,
        });
    }

    // If consent is granted, return all data
    if (consent.granted) {
        if (debug) {
            console.log('LeadLoopr: Consent granted, including all data');
        }
        return {
            data: rawData as Record<string, string>,
            excluded: [],
        };
    }

    // Filter out PII fields
    const data: Record<string, string> = {};
    const excluded: string[] = [];

    Object.entries(rawData).forEach(([key, value]) => {
        if (value && !isPIIField(key)) {
            data[key] = value;
        } else if (value) {
            excluded.push(key);
        }
    });

    if (debug) {
        console.log('LeadLoopr: Consent not granted, filtered data:', {
            included: Object.keys(data),
            excluded,
        });
    }

    return { data, excluded };
} 
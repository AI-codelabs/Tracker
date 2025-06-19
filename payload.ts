import type { AttributionData } from './attribution';
import type { ConsentStatus } from './consent';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [500, 1500, 3000]; // Exponential backoff delays in ms

export interface LeadPayload {
    org_id: string;
    timestamp: number;
    attribution: AttributionData;
    consent: ConsentStatus;
    form_data: Record<string, string>;
}

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function attemptSend(
    payload: LeadPayload,
    endpoint: string,
    attempt: number,
    debug: boolean
): Promise<boolean> {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'omit',
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (debug) {
            console.log('LeadLoopr: Lead payload sent successfully');
        }
        return true;
    } catch (error) {
        if (debug) {
            console.warn(`LeadLoopr: Send attempt ${attempt} failed:`, error);
        }
        return false;
    }
}

export async function sendLeadPayload(
    payload: LeadPayload,
    endpoint: string,
    debug = false
): Promise<void> {
    if (debug) {
        console.log('LeadLoopr: Sending lead payload:', payload);
    }

    let success = false;
    let attempt = 0;

    while (!success && attempt < MAX_RETRIES) {
        if (attempt > 0) {
            const delay = RETRY_DELAYS[attempt - 1];
            if (debug) {
                console.log(`LeadLoopr: Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
            }
            await sleep(delay);
        }

        success = await attemptSend(payload, endpoint, attempt + 1, debug);
        attempt++;
    }

    if (!success && debug) {
        console.error('LeadLoopr: Failed to send lead payload after all retries');
    }
} 
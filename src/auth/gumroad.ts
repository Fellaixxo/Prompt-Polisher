import { CONFIG } from '../config';
import type { Env, GumroadResponse } from '../types';

export interface GumroadLicenseResult {
  status: 'valid' | 'invalid' | 'error';
  message?: string;
  email?: string;
}

export async function verifyGumroadLicense(
  licenseKey: string,
  env: Env
): Promise<GumroadLicenseResult> {
  try {
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_permalink: CONFIG.GUMROAD_PERMALINK,
        license_key: licenseKey,
      }),
    });

    if (!response.ok) {
      return { status: 'error', message: `Gumroad API returned HTTP ${response.status}` };
    }

    const data: GumroadResponse = await response.json();

    if (data?.success === true) {
      return { status: 'valid', email: data.purchase?.email };
    } else if (data?.success === false) {
      return { status: 'invalid', message: data.message || 'License key not found.' };
    }

    return { status: 'error', message: 'Unexpected response from Gumroad.' };
  } catch (error: any) {
    return { status: 'error', message: `Network error: ${error.message}` };
  }
}

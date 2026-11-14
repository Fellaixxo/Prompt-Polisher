interface GumroadLicenseResponse {
  success: boolean;
  purchase?: { email: string; license_key: string };
  message?: string;
}

interface GumroadLicenseResult {
  status: 'valid' | 'invalid' | 'error';
  email?: string;
  message?: string;
}

export async function verifyGumroadLicense(licenseKey: string): Promise<GumroadLicenseResult> {
  try {
    const response = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ product_permalink: "xpmzi", license_key: licenseKey })
    });
    if (!response.ok) {
      return { status: "error", message: `Gumroad API returned HTTP ${response.status}` };
    }
    const data: GumroadLicenseResponse = await response.json();
    if (data.success === true) {
      return { status: "valid", email: data.purchase?.email };
    } else {
      return { status: "invalid", message: data.message || "License key not found." };
    }
  } catch (e: any) {
    return { status: "error", message: `Network error: ${e.message}` };
  }
}

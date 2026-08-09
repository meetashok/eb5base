export type UscisCaseStatusResult = {
  receiptNumber: string;
  status: string;
  statusDate: string | null;
  formType: string | null;
  error?: 'not_found' | 'invalid' | 'upstream' | null;
};

const STUB_STATUSES = [
  'Case Was Received',
  'Case Is Being Actively Reviewed By USCIS',
  'Request for Additional Evidence Was Sent',
  'Response To USCIS&#39; Request For Evidence Was Received',
  'Case Was Approved',
  'Card Was Produced',
  'Interview Was Scheduled',
];

function hashReceipt(receipt: string): number {
  let h = 0;
  for (let i = 0; i < receipt.length; i++) {
    h = (h * 31 + receipt.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Deterministic-ish stub that can advance over time for demos */
export async function getStubCaseStatus(receiptNumber: string): Promise<UscisCaseStatusResult> {
  const receipt = receiptNumber.trim().toUpperCase();
  if (!/^[A-Z]{3}\d{10}$/.test(receipt)) {
    return {
      receiptNumber: receipt,
      status: 'Invalid receipt number',
      statusDate: null,
      formType: null,
      error: 'invalid',
    };
  }

  const dayBucket = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const idx = (hashReceipt(receipt) + dayBucket) % STUB_STATUSES.length;
  const status = STUB_STATUSES[idx].replace('&#39;', "'");

  const filedOffsetDays = (hashReceipt(receipt) % 90) + 30;
  const statusDate = new Date(Date.now() - filedOffsetDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return {
    receiptNumber: receipt,
    status,
    statusDate,
    formType: null,
    error: null,
  };
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getLiveAccessToken(): Promise<string> {
  const clientId = process.env.USCIS_CLIENT_ID;
  const clientSecret = process.env.USCIS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('USCIS_CLIENT_ID / USCIS_CLIENT_SECRET not configured');
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  // Sandbox OAuth token endpoint — confirm with USCIS docs when going live
  const tokenUrl =
    process.env.USCIS_TOKEN_URL || 'https://api-int.uscis.gov/oauth/accesstoken';

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    throw new Error(`USCIS token error: ${res.status}`);
  }

  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) {
    throw new Error('USCIS token response missing access_token');
  }

  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

export async function getLiveCaseStatus(receiptNumber: string): Promise<UscisCaseStatusResult> {
  const receipt = receiptNumber.trim().toUpperCase();
  const base = process.env.USCIS_CASE_STATUS_URL || 'https://api-int.uscis.gov/case-status';
  const token = await getLiveAccessToken();

  const res = await fetch(`${base}/${encodeURIComponent(receipt)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (res.status === 404) {
    return {
      receiptNumber: receipt,
      status: 'Case not found',
      statusDate: null,
      formType: null,
      error: 'not_found',
    };
  }

  if (!res.ok) {
    return {
      receiptNumber: receipt,
      status: 'Unable to retrieve status',
      statusDate: null,
      formType: null,
      error: 'upstream',
    };
  }

  const json = (await res.json()) as Record<string, unknown>;
  // Shape varies; normalize common fields
  const caseStatus =
    (json.current_case_status_text_en as string) ||
    (json.status as string) ||
    (json.case_status as string) ||
    'Status unavailable';
  const statusDate =
    (json.current_case_status_date as string) ||
    (json.status_date as string) ||
    null;

  return {
    receiptNumber: receipt,
    status: caseStatus,
    statusDate: statusDate ? String(statusDate).slice(0, 10) : null,
    formType: (json.form_type as string) || null,
    error: null,
  };
}

export async function getCaseStatus(receiptNumber: string): Promise<UscisCaseStatusResult> {
  const mode = (process.env.USCIS_API_MODE || 'stub').toLowerCase();
  if (mode === 'live') {
    return getLiveCaseStatus(receiptNumber);
  }
  return getStubCaseStatus(receiptNumber);
}

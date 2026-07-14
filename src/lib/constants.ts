import type { Classification, FormType, I956FStatus, NotifyMode, WomStatus } from './types';

export const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
] as const;

export const RECEIPT_PREFIXES = ['IOE', 'SRC', 'MSC', 'LIN', 'EAC', 'WAC', 'NBC'] as const;

export const FORM_TYPES: FormType[] = ['I-526E', 'I-485', 'I-131', 'I-765'];

export const PRIMARY_FORM_TYPES: FormType[] = ['I-526E', 'I-485', 'I-131', 'I-765'];

export const DERIVATIVE_FORM_TYPES: FormType[] = ['I-485', 'I-131', 'I-765'];

export const CLASSIFICATION_OPTIONS: { value: Classification; label: string }[] = [
  { value: 'rural', label: 'Rural' },
  { value: 'hua', label: 'HUA' },
  { value: 'both', label: 'Both' },
];

export const I956F_STATUS_OPTIONS: { value: I956FStatus; label: string }[] = [
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'unknown', label: 'Unknown' },
];

export const WOM_STATUS_OPTIONS: { value: WomStatus; label: string }[] = [
  { value: 'filed', label: 'Filed' },
  { value: 'hearing_scheduled', label: 'Hearing Scheduled' },
  { value: 'decided_favorable', label: 'Decided - Favorable' },
  { value: 'decided_unfavorable', label: 'Decided - Unfavorable' },
  { value: 'settled', label: 'Settled' },
  { value: 'dismissed', label: 'Dismissed' },
];

export const NOTIFY_MODE_OPTIONS: { value: NotifyMode; label: string }[] = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'digest', label: 'Daily digest' },
];

export const INSIGHTS_MIN_USERS = 5;

/**
 * Naming convention for user-facing copy:
 * - "EB5 Base" — product/brand (matches domain eb5base.com)
 * - "EB-5" — USCIS visa program
 */
export const DISCLAIMER =
  'EB5 Base helps EB-5 investors track USCIS case status for informational purposes only. It is not affiliated with USCIS, any regional center, or any immigration law firm. Status data comes from USCIS (or a development stub) and may be delayed or incomplete. Nothing on this site constitutes legal, financial, or investment advice. Always consult a qualified immigration attorney.';

export const SITE_URL = 'https://eb5base.com';

export const CONTACT_EMAIL = 'hello@eb5base.com';

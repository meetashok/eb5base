import type { F956Status, ProjectType, SubscriptionStatus, TeaDesignation } from './types';

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

export const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'mixed_use', label: 'Mixed Use' },
  { value: 'other', label: 'Other' },
];

export const TEA_OPTIONS: { value: TeaDesignation; label: string }[] = [
  { value: 'rural', label: 'Rural' },
  { value: 'hua', label: 'HUA' },
  { value: 'infra', label: 'Infra' },
];

export const F956_OPTIONS: { value: F956Status; label: string }[] = [
  { value: 'not_filed', label: 'Not Filed' },
  { value: 'filed', label: 'Filed' },
  { value: 'rfe', label: 'RFE' },
  { value: 'rfe_response_submitted', label: 'RFE Response Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
  { value: 'unknown', label: 'Unknown' },
];

export const SUBSCRIPTION_OPTIONS: { value: SubscriptionStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'not_yet_open', label: 'Not Yet Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'unknown', label: 'Unknown' },
];

export const CONTACT_ROLES = ['Sales', 'Owner', 'Manager', 'Legal', 'Other'] as const;

export const ROLE_OPTIONS = [
  { value: 'investor', label: "I'm an Investor" },
  { value: 'rc_operator', label: "I'm an RC Operator" },
  { value: 'attorney', label: "I'm an Attorney" },
  { value: 'agent', label: "I'm an Agent" },
] as const;

export const DISCLAIMER =
  'EB5 Base is a community-maintained directory of EB-5 projects for informational purposes only. It is not affiliated with USCIS, any regional center, or any immigration law firm. Listings are user-contributed and not independently verified. Nothing on this site constitutes legal, financial, or investment advice. Always consult a qualified immigration attorney before making investment decisions.';

export const PAGE_SIZE = 20;

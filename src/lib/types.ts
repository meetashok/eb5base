export type F956Status =
  | 'not_filed'
  | 'filed'
  | 'rfe'
  | 'rfe_response_submitted'
  | 'approved'
  | 'denied'
  | 'unknown';

export type SubscriptionStatus = 'open' | 'not_yet_open' | 'closed' | 'unknown';

export type UserRole = 'investor' | 'rc_operator' | 'attorney' | 'agent';

export type ProjectType =
  | 'real_estate'
  | 'hospitality'
  | 'infrastructure'
  | 'manufacturing'
  | 'mixed_use'
  | 'other';

export type TeaDesignation = 'rural' | 'hua' | 'infra';

export type InvestorStage = 'considering' | 'invested';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole | null;
  bio: string | null;
  country_of_birth: string | null;
  investor_stage: InvestorStage | null;
  show_profile_public: boolean;
  email_notifications: boolean;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

/** User-facing regional center organization */
export interface RcBrand {
  id: string;
  name: string;
  slug: string | null;
  website_url: string | null;
  description: string | null;
  logo_url: string | null;
  status: 'pending' | 'approved' | 'rejected' | null;
  created_at: string;
  updated_at: string;
  projects?: { count: number }[] | null;
  regional_centers?: { count: number }[] | null;
}

export interface RcBrandContact {
  id: string;
  brand_id: string;
  name: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

/** USCIS-registered entity (reference data under a brand) */
export interface RegionalCenter {
  id: string;
  name: string;
  uscis_rc_id: string | null;
  website_url: string | null;
  description: string | null;
  logo_url: string | null;
  headquarters_state: string | null;
  operating_states: string[] | null;
  contact_email: string | null;
  contact_phone: string | null;
  brand_id: string | null;
  created_at: string;
  updated_at: string;
  projects?: { count: number }[] | null;
}

export interface RcMembership {
  id: string;
  rc_id: string;
  user_id: string;
  role: 'admin' | 'editor' | 'viewer';
  active: boolean;
  verified_at: string | null;
  revoked_at: string | null;
  created_at: string;
  regional_centers?: Pick<RegionalCenter, 'id' | 'name'> | null;
}

export interface Project {
  id: string;
  name: string;
  slug: string | null;
  project_type: string[] | null;
  location_city: string | null;
  location_state: string | null;
  rc_id: string | null;
  brand_id: string | null;
  tea_designations: string[] | null;
  f956_status: F956Status | null;
  f956_approval_date: string | null;
  investment_amount: number | null;
  total_slots: number | null;
  subscription_status: SubscriptionStatus | null;
  status: 'pending' | 'approved' | 'rejected' | null;
  website_url: string | null;
  notes: string | null;
  added_by: string | null;
  merged_into: string | null;
  created_at: string;
  updated_at: string;
  rc_brands?: Pick<RcBrand, 'id' | 'name' | 'website_url' | 'slug'> | null;
  regional_centers?: Pick<
    RegionalCenter,
    'id' | 'name' | 'uscis_rc_id' | 'website_url'
  > | null;
  profiles?: Pick<Profile, 'display_name' | 'avatar_url'> | null;
}

export interface ProjectContact {
  id: string;
  project_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  created_at: string;
}

export interface ProjectVote {
  id: string;
  project_id: string;
  user_id: string;
  subscription_status: string;
  invested: boolean;
  investment_date: string | null;
  created_at: string;
}

export interface DuplicateReport {
  id: string;
  project_id: string;
  duplicate_of_id: string;
  reported_by: string;
  created_at: string;
}

export interface ProjectWithVotes extends Project {
  vote_count?: number;
  confirmation_count?: number;
  last_vote_status?: string | null;
  last_vote_at?: string | null;
  project_votes?: { count: number }[] | null;
}

export interface VoteWithProfile extends ProjectVote {
  profiles?: Pick<Profile, 'display_name' | 'avatar_url'> | null;
}

/** Prefer brand join; keep regional_centers as fallback during migration */
export const PROJECT_SELECT =
  '*, rc_brands!brand_id(id, name, website_url, slug), regional_centers(id, name, uscis_rc_id, website_url)';

export function projectBrandName(project: Project): string | null {
  return project.rc_brands?.name || project.regional_centers?.name || null;
}

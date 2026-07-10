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

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  bio: string | null;
  country_of_birth: string | null;
  investor_stage: string | null;
  show_profile_public: boolean;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
}

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
}

export interface Project {
  id: string;
  name: string;
  project_type: string[] | null;
  location_city: string | null;
  location_state: string | null;
  rc_id: string | null;
  tea_designations: string[] | null;
  f956_status: F956Status | null;
  f956_approval_date: string | null;
  investment_amount: number | null;
  subscription_status: SubscriptionStatus | null;
  website_url: string | null;
  notes: string | null;
  added_by: string | null;
  merged_into: string | null;
  created_at: string;
  updated_at: string;
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

export const PROJECT_SELECT =
  '*, regional_centers(id, name, uscis_rc_id, website_url), profiles!added_by(display_name, avatar_url), project_votes(count)';

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

/** Case Tracker domain */
export type Classification = 'rural' | 'hua' | 'both';
export type I956FStatus = 'approved' | 'pending' | 'unknown';
export type FormType = 'I-526E' | 'I-485' | 'I-131' | 'I-765';
export type NotifyMode = 'immediate' | 'digest';
export type WomStatus =
  | 'filed'
  | 'hearing_scheduled'
  | 'decided_favorable'
  | 'decided_unfavorable'
  | 'settled'
  | 'dismissed';
export type AuditAction = 'decrypt' | 'encrypt' | 'delete_account' | 'export_data';
export type AuditActor = 'system_poller' | 'user_session' | 'admin';
export type ServiceCenter = 'IOE' | 'SRC' | 'MSC' | 'LIN' | 'EAC' | 'WAC' | 'NBC';
export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'muted';

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
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  /** Case Tracker fields (migration 20260717) */
  project_name?: string | null;
  regional_center_name?: string | null;
  classification?: Classification | null;
  i956f_status?: I956FStatus | null;
  i956f_approval_date?: string | null;
  attorney_name?: string | null;
  agent_name?: string | null;
  notify_mode?: NotifyMode;
  onboarding_complete?: boolean;
  last_manual_refresh_at?: string | null;
  last_viewed_timeline_at?: string | null;
}

export interface Individual {
  id: string;
  user_id: string;
  tag: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface CaseRow {
  id: string;
  individual_id: string;
  user_id: string;
  receipt_number_encrypted: string;
  form_type: FormType;
  service_center: string | null;
  filed_date: string | null;
  current_status: string | null;
  status_updated_at: string | null;
  last_polled_at: string | null;
  poll_error: string | null;
  created_at: string;
}

/** Case with decrypted receipt, only returned to the owning user via server APIs */
export interface CaseWithReceipt extends Omit<CaseRow, 'receipt_number_encrypted'> {
  receipt_number: string;
  receipt_number_masked: string;
}

export interface CaseStatusHistory {
  id: string;
  case_id: string;
  status: string;
  status_date: string | null;
  detected_at: string;
  notified: boolean;
}

export interface WomCase {
  id: string;
  user_id: string;
  related_form_type: FormType;
  court_district: string | null;
  filed_date: string | null;
  wom_status: WomStatus;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  actor: AuditActor;
  user_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface IndividualWithCases extends Individual {
  cases: CaseWithReceipt[];
}

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

/** User-facing regional center organization */
export interface RcBrand {
  id: string;
  name: string;
  slug: string | null;
  website_url: string | null;
  description: string | null;
  logo_url: string | null;
  status: ModerationStatus | null;
  rejection_reason: string | null;
  added_by: string | null;
  merged_into: string | null;
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
  status: ModerationStatus | null;
  rejection_reason: string | null;
  website_url: string | null;
  notes: string | null;
  added_by: string | null;
  merged_into: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
  rc_verified_at: string | null;
  rc_verified_by: string | null;
  created_at: string;
  updated_at: string;
  cover_image_id?: string | null;
  rc_brands?: Pick<RcBrand, 'id' | 'name' | 'website_url' | 'slug'> | null;
  regional_centers?: Pick<
    RegionalCenter,
    'id' | 'name' | 'uscis_rc_id' | 'website_url'
  > | null;
  profiles?: Pick<Profile, 'display_name' | 'avatar_url'> | null;
  cover_image?: Pick<ProjectImage, 'id' | 'url'> | null;
}

export interface ProjectImage {
  id: string;
  project_id: string;
  storage_path: string;
  url: string;
  sort_order: number;
  uploaded_by: string | null;
  created_at: string;
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

export type DuplicateReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface DuplicateReportGroup {
  id: string;
  entity_type: 'project' | 'rc_brand';
  reported_entity_id: string;
  duplicate_entity_ids: string[];
  reported_by: string | null;
  status: DuplicateReportStatus;
  canonical_entity_id: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface ProjectWithVotes extends Project {
  vote_count?: number;
  confirmation_count?: number;
  last_vote_status?: string | null;
  last_vote_at?: string | null;
  confirmations_7d?: number;
  open_7d?: number;
  closed_7d?: number;
  consensus_7d?: 'open' | 'closed' | null;
  open_pct_7d?: number | null;
  project_votes?: { count: number }[] | null;
}

export interface VoteWithProfile extends ProjectVote {
  profiles?: Pick<Profile, 'display_name' | 'avatar_url'> | null;
}

export interface ContentSubmission {
  id: string;
  entity_type: 'project' | 'rc_brand';
  entity_id: string;
  action: 'create' | 'update';
  payload: Record<string, unknown>;
  status: ModerationStatus;
  rejection_reason: string | null;
  submitted_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  /** Joined for display */
  entity_name?: string | null;
}

/** Prefer brand join; keep regional_centers as fallback during migration */
export const PROJECT_SELECT =
  '*, cover_image:project_images!cover_image_id(id, url), rc_brands!brand_id(id, name, website_url, slug), regional_centers(id, name, uscis_rc_id, website_url)';
export const PROJECT_SELECT_LEGACY =
  '*, rc_brands!brand_id(id, name, website_url), regional_centers(id, name, uscis_rc_id, website_url)';
export const PROJECT_SELECT_NO_IMAGES =
  '*, rc_brands!brand_id(id, name, website_url, slug), regional_centers(id, name, uscis_rc_id, website_url)';

export function projectBrandName(project: Project): string | null {
  return project.rc_brands?.name || project.regional_centers?.name || null;
}

export function projectCoverUrl(project: Project): string | null {
  return project.cover_image?.url ?? null;
}

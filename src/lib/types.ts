/** Case tracker domain types */

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

/** Extends auth.users — directory-era columns may still exist in DB but are unused in v0 UI */
export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  country_of_birth: string | null;
  project_name: string | null;
  regional_center_name: string | null;
  classification: Classification | null;
  i956f_status: I956FStatus | null;
  i956f_approval_date: string | null;
  attorney_name: string | null;
  agent_name: string | null;
  email_notifications: boolean;
  notify_mode: NotifyMode;
  onboarding_complete: boolean;
  last_manual_refresh_at: string | null;
  last_viewed_timeline_at: string | null;
  created_at: string;
  updated_at: string;
  /** Legacy directory field — kept for DB compat, unused in case-tracker UI */
  profile_completed?: boolean;
  role?: string | null;
  is_admin?: boolean;
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

/** Case with decrypted receipt — only returned to the owning user via server APIs */
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

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'muted';

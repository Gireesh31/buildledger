export type ProjectStatus = "planning" | "active" | "on-hold" | "completed";
export type ProjectType = "residential" | "commercial" | "renovation" | "infrastructure" | "other";

export interface Project {
  id: string;
  name: string;
  description?: string;
  location?: string;
  projectType?: ProjectType;
  status: ProjectStatus;
  /** Planned budget in rupees. */
  budget?: number;
  /** Built-up area in sq ft. */
  areaSqft?: number;
  startDate?: string;
  endDate?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectRole = "owner" | "editor" | "viewer";

export interface User {
  id: string;
  /** Full name shown around the app: first + last name. */
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  /** Profile photo URL (versioned, so a new upload isn't served from cache). */
  photoUrl?: string;
  createdAt: string;
  onboardedAt?: string;
  /** Set once the person proves they own the email (link in an email, or Google sign-in). Project invites need it. */
  emailVerifiedAt?: string;
  /** Can open the admin panel. Only set for admins. */
  isAdmin?: boolean;
  /** Set when an admin has blocked the account: it can't sign in. */
  disabledAt?: string;
}

export type InviteRole = "editor" | "viewer";

export interface Invite {
  id: string;
  projectId: string;
  email: string;
  role: InviteRole;
  invitedBy: string;
  createdAt: string;
}

/** A row in one of the project ledgers (materials, workers, transport, ...). Fields depend on the collection. */
export interface LedgerRecord {
  id: string;
  projectId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  [field: string]: string | number | undefined;
}

export type AttachmentKind = "bill" | "photo" | "document";

export interface Attachment {
  id: string;
  projectId: string;
  kind: AttachmentKind;
  fileName: string;
  mimeType: string;
  size: number;
  /** Optional link to the record it belongs to, e.g. an expense or daily log. */
  collection?: string;
  recordId?: string;
  caption?: string;
  uploadedBy: string;
  createdAt: string;
}

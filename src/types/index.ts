export type UserRole = "admin" | "worker";

export type JobStatus =
  | "unassigned"
  | "assigned"
  | "in_progress"
  | "completed";

export type JobPartStatus = "open" | "completed" | "reviewed";

export type AppUser = {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
};

export type JobPart = {
  id: string;
  trade: string;
  assignedWorkerIds: string[];
  status: JobPartStatus;
  completedBy: string;
};

export type JobPartRecord = JobPart & {
  jobId: string;
};

export type Job = {
  id: string;
  client: string;
  title: string;
  address: string;
  /**
   * Legacy Toggl duration. Still stored so older jobs load. Not shown on the card.
   */
  duration: string;
  notes: string;
  status: JobStatus;
  assignedWorkerIds: string[];
  /**
   * Calendar day the work is for, YYYY-MM-DD.
   * Empty on jobs saved before this field existed.
   */
  jobDate: string;
  createdAt: Date;
};

export type NotificationKind =
  | "job_assigned"
  | "job_updated"
  | "job_unassigned"
  | "job_removed";

export type CrewNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
  jobId: string;
  kind: NotificationKind;
};

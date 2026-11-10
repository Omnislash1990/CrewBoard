export type UserRole = "admin" | "worker";

export type JobStatus =
  | "unassigned"
  | "assigned"
  | "in_progress"
  | "completed";

export type AppUser = {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
};

export type Job = {
  id: string;
  client: string;
  title: string;
  duration: string;
  notes: string;
  status: JobStatus;
  assignedWorkerIds: string[];
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

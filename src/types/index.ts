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

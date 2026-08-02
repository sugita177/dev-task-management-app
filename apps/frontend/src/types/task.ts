export type TaskProgressState = 'BACKLOG' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type RoleName = 'ADMINISTRATOR' | 'ENGINEERING_MANAGER' | 'ENGINEER' | 'BUSINESS';

export interface Role {
  id?: string;
  name: RoleName | string;
}

export interface Project {
  id: string;
  name: string;
  isArchived?: boolean;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  role?: Role | string;
  roleName?: RoleName | string;
  initials?: string;
  maxHours?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  ticketId?: string;
  assignedUserId?: string;
  progressState: TaskProgressState;
  categoryId: string;
  priority: TaskPriority;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  estimatedHours?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  projectId: string;
  ticketId?: string;
  assignedUserId?: string;
  categoryId: string;
  priority: TaskPriority;
  plannedStartDate?: string;
  plannedEndDate?: string;
  estimatedHours?: number;
  createdBy: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  projectId?: string;
  ticketId?: string;
  assignedUserId?: string;
  progressState?: TaskProgressState;
  categoryId?: string;
  priority?: TaskPriority;
  plannedStartDate?: string;
  plannedEndDate?: string;
  estimatedHours?: number;
  changedBy?: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  userName?: string;
  comment: string;
  content?: string;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName?: string;
  comment: string;
  createdAt: string;
}

export interface WorkLog {
  id: string;
  taskId: string;
  userId: string;
  userName?: string;
  loggedDate: string;
  hours: number;
  description?: string;
  createdAt: string;
}

export interface TaskHistory {
  id: string;
  taskId: string;
  changedBy: string;
  changedByName?: string;
  actionType: string;
  beforePayload?: Record<string, unknown>;
  afterPayload?: Record<string, unknown>;
  changedAt: string;
}

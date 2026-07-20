export type TaskProgressState = 'BACKLOG' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Project {
  id: string;
  name: string;
  isArchived: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
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
  assignedUserId?: string;
  progressState?: TaskProgressState;
  categoryId?: string;
  priority?: TaskPriority;
  plannedStartDate?: string;
  plannedEndDate?: string;
  estimatedHours?: number;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkLog {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  loggedDate: string;
  hours: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskHistory {
  id: string;
  taskId: string;
  changedBy: string;
  changedByName: string;
  actionType: string;
  beforePayload?: any;
  afterPayload?: any;
  comment?: string;
  changedAt: string;
}

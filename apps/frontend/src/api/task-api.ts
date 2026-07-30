import type { Task, CreateTaskDto, UpdateTaskDto, Comment, WorkLog, TaskHistory, Project, User } from '../types/task';
import { apiClient } from '../lib/api-client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roleId: string;
  roleName: string;
  organizationId?: string;
  organizationName?: string;
}

export const masterApi = {
  async getCategories(): Promise<{ id: string; name: string; code: string }[]> {
    const res = await apiClient.get('/categories');
    return res.data;
  },

  async getOrganizations(): Promise<{ id: string; name: string; code: string }[]> {
    const res = await apiClient.get('/organizations');
    return res.data;
  },
};

export const authApi = {
  async login(email: string, password: string): Promise<{ user: AuthUser }> {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      return res.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'ログインに失敗しました。';
      throw new Error(errorMsg);
    }
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async me(): Promise<AuthUser> {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

export const taskApi = {
  async list(): Promise<Task[]> {
    const res = await apiClient.get('/tasks');
    return res.data;
  },

  async get(id: string): Promise<Task> {
    const res = await apiClient.get(`/tasks/${id}`);
    return res.data;
  },

  async create(dto: CreateTaskDto): Promise<Task> {
    try {
      const res = await apiClient.post('/tasks', dto);
      return res.data;
    } catch (err: any) {
      const errData = err.response?.data || {};
      const errorMsg = Array.isArray(errData.message) ? errData.message.join(', ') : (errData.message || 'Failed to create task');
      throw new Error(errorMsg);
    }
  },

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    try {
      const res = await apiClient.put(`/tasks/${id}`, dto);
      return res.data;
    } catch (err: any) {
      const errData = err.response?.data || {};
      const errorMsg = Array.isArray(errData.message) ? errData.message.join(', ') : (errData.message || `Failed to update task ${id}`);
      throw new Error(errorMsg);
    }
  },
};

export const commentApi = {
  async list(taskId: string): Promise<Comment[]> {
    const res = await apiClient.get(`/tasks/${taskId}/comments`);
    return res.data;
  },

  async create(taskId: string, userId: string, content: string): Promise<Comment> {
    const res = await apiClient.post(`/tasks/${taskId}/comments`, { userId, content });
    return res.data;
  },
};

export const workLogApi = {
  async list(taskId: string): Promise<WorkLog[]> {
    const res = await apiClient.get(`/tasks/${taskId}/work-logs`);
    return res.data;
  },

  async create(taskId: string, userId: string, loggedDate: string, hours: number, description?: string): Promise<WorkLog> {
    const res = await apiClient.post(`/tasks/${taskId}/work-logs`, { userId, loggedDate, hours, description });
    return res.data;
  },
};

export const historyApi = {
  async list(taskId: string): Promise<TaskHistory[]> {
    const res = await apiClient.get(`/tasks/${taskId}/histories`);
    return res.data;
  },
};

export const projectApi = {
  async list(): Promise<Project[]> {
    const res = await apiClient.get('/projects');
    return res.data;
  },
};

export const userApi = {
  async list(): Promise<User[]> {
    const res = await apiClient.get('/users');
    return res.data;
  },
};

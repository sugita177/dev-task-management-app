import type { Task, CreateTaskDto, UpdateTaskDto, Comment, WorkLog, TaskHistory, Project, User } from '../types/task';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roleId: string;
  roleName: string;
}

export const authApi = {
  async login(email: string, password: string): Promise<{ user: AuthUser }> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'ログインに失敗しました。');
    }
    return res.json();
  },

  async logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  },

  async me(): Promise<AuthUser> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error('Unauthenticated');
    }
    return res.json();
  },
};

export const taskApi = {
  async list(): Promise<Task[]> {
    const res = await fetch(`${API_BASE_URL}/tasks`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async get(id: string): Promise<Task> {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error(`Failed to fetch task ${id}`);
    return res.json();
  },

  async create(dto: CreateTaskDto): Promise<Task> {
    const res = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errorMsg = Array.isArray(errData.message) ? errData.message.join(', ') : (errData.message || 'Failed to create task');
      throw new Error(errorMsg);
    }
    return res.json();
  },

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errorMsg = Array.isArray(errData.message) ? errData.message.join(', ') : (errData.message || `Failed to update task ${id}`);
      throw new Error(errorMsg);
    }
    return res.json();
  },
};

export const commentApi = {
  async list(taskId: string): Promise<Comment[]> {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json();
  },

  async create(taskId: string, userId: string, content: string): Promise<Comment> {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId, content }),
    });
    if (!res.ok) throw new Error('Failed to create comment');
    return res.json();
  },
};

export const workLogApi = {
  async list(taskId: string): Promise<WorkLog[]> {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/work-logs`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch work logs');
    return res.json();
  },

  async create(taskId: string, userId: string, loggedDate: string, hours: number, description?: string): Promise<WorkLog> {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/work-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId, loggedDate, hours, description }),
    });
    if (!res.ok) throw new Error('Failed to create work log');
    return res.json();
  },
};

export const historyApi = {
  async list(taskId: string): Promise<TaskHistory[]> {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/histories`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch histories');
    return res.json();
  },
};

export const projectApi = {
  async list(): Promise<Project[]> {
    const res = await fetch(`${API_BASE_URL}/projects`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },
};

export const userApi = {
  async list(): Promise<User[]> {
    const res = await fetch(`${API_BASE_URL}/users`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },
};

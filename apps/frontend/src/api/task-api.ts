import type { Task, CreateTaskDto, UpdateTaskDto, Comment, WorkLog, TaskHistory, Project, User } from '../types/task';

// 環境変数 VITE_API_BASE_URL があれば優先使用し、開発環境ではプロキシ経由の相対パス /api をデフォルトとする
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const taskApi = {
  async list(): Promise<Task[]> {
    const res = await fetch(`${API_BASE_URL}/tasks`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async get(id: string): Promise<Task> {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch task ${id}`);
    return res.json();
  },

  async create(dto: CreateTaskDto): Promise<Task> {
    const res = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments`);
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json();
  },

  async create(taskId: string, userId: string, content: string): Promise<Comment> {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, content }),
    });
    if (!res.ok) throw new Error('Failed to create comment');
    return res.json();
  },
};

export const workLogApi = {
  async list(taskId: string): Promise<WorkLog[]> {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/work-logs`);
    if (!res.ok) throw new Error('Failed to fetch work logs');
    return res.json();
  },

  async create(taskId: string, userId: string, loggedDate: string, hours: number, description?: string): Promise<WorkLog> {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/work-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, loggedDate, hours, description }),
    });
    if (!res.ok) throw new Error('Failed to create work log');
    return res.json();
  },
};

export const historyApi = {
  async list(taskId: string): Promise<TaskHistory[]> {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/histories`);
    if (!res.ok) throw new Error('Failed to fetch histories');
    return res.json();
  },
};


export const projectApi = {
  async list(): Promise<Project[]> {
    const res = await fetch(`${API_BASE_URL}/projects`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },
};

export const userApi = {
  async list(): Promise<User[]> {
    const res = await fetch(`${API_BASE_URL}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },
};


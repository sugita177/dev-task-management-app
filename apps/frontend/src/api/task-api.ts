import type { Task, CreateTaskDto, UpdateTaskDto } from '../types/task';

// 環境変数 VITE_API_BASE_URL があれば使用し、無ければローカルホストをデフォルトとする
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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


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
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error(`Failed to update task ${id}`);
    return res.json();
  },
};

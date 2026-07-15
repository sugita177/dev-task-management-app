import { create } from 'zustand';
import type { TaskProgressState, TaskPriority } from '../types/task';

interface TaskFilterState {
  projectIds: string[];
  assignedUserId?: string; // 'unassigned' | 'me' | 'some-user-uuid'
  progressStates: TaskProgressState[];
  priorities: TaskPriority[];
  keyword: string;
  sortBy: 'priority' | 'plannedEndDate' | 'updatedAt' | 'createdAt';
  sortOrder: 'asc' | 'desc';

  // アクション（状態更新メソッド）
  setProjectIds: (ids: string[]) => void;
  setAssignedUserId: (userId?: string) => void;
  setProgressStates: (states: TaskProgressState[]) => void;
  setPriorities: (priorities: TaskPriority[]) => void;
  setKeyword: (keyword: string) => void;
  setSort: (sortBy: 'priority' | 'plannedEndDate' | 'updatedAt' | 'createdAt', sortOrder: 'asc' | 'desc') => void;
  resetFilters: () => void;
}

const initialFilters = {
  projectIds: [],
  assignedUserId: undefined,
  progressStates: [],
  priorities: [],
  keyword: '',
  sortBy: 'updatedAt' as const,
  sortOrder: 'desc' as const,
};

export const useTaskStore = create<TaskFilterState>((set) => ({
  ...initialFilters,

  setProjectIds: (projectIds) => set({ projectIds }),
  setAssignedUserId: (assignedUserId) => set({ assignedUserId }),
  setProgressStates: (progressStates) => set({ progressStates }),
  setPriorities: (priorities) => set({ priorities }),
  setKeyword: (keyword) => set({ keyword }),
  setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
  resetFilters: () => set({ ...initialFilters }),
}));

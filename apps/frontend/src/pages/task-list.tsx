import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi, projectApi, userApi, commentApi, workLogApi, historyApi } from '../api/task-api';
import { useTaskStore } from '../store/task-store';
import { useAuthStore } from '../store/auth-store';
import type { Task, TaskProgressState, TaskPriority, UpdateTaskDto, TaskHistory, User, Project } from '../types/task';

// モックマスターデータ定義（バックエンドのバリデーションに適合するよう正しいUUIDフォーマットに変更）
const mockProjects = [
  { id: '00000000-0000-0000-0000-000000000201', name: '認証基盤システム' },
  { id: '00000000-0000-0000-0000-000000000202', name: 'DevTaskApp' },
  { id: '00000000-0000-0000-0000-000000000203', name: '共通APIサービス' },
];

const mockCategories = [
  { id: '00000000-0000-0000-0000-000000000301', name: 'フロントエンド' },
  { id: '00000000-0000-0000-0000-000000000302', name: 'バックエンド' },
  { id: '00000000-0000-0000-0000-000000000303', name: 'デザイン/UI' },
  { id: '00000000-0000-0000-0000-000000000304', name: 'インフラ/DevOps' },
];

const mockUsers = [
  { id: '00000000-0000-0000-0000-000000000401', name: 'Satoshi Manager' },
  { id: '00000000-0000-0000-0000-000000000402', name: '田中 太郎' },
  { id: '00000000-0000-0000-0000-000000000403', name: '鈴木 一郎' },
];

export default function TaskList() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [taskScopeFilter, setTaskScopeFilter] = useState<'ALL' | 'ASSIGNED' | 'CREATED'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // フォーム用ローカルステート (タスク作成)
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newProj, setNewProj] = useState(mockProjects[0].id);
  const [newCat, setNewCat] = useState(mockCategories[0].id);
  const [newPriority, setNewPriority] = useState<TaskPriority>('MEDIUM');
  const [newEstimate, setNewEstimate] = useState<number>(0);
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');

  // フォーム用ローカルステート (タスク編集)
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editProj, setEditProj] = useState('');
  const [editCat, setEditCat] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('MEDIUM');
  const [editStatus, setEditStatus] = useState<TaskProgressState>('BACKLOG');
  const [editEstimate, setEditEstimate] = useState<number>(0);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editAssignee, setEditAssignee] = useState('');

  // 新機能用ローカルステート (タブ、コメント、工数)
  const [activeTab, setActiveTab] = useState<'info' | 'comments' | 'worklog' | 'history'>('info');
  const [commentText, setCommentText] = useState('');
  const [workLogDate, setWorkLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [workLogHours, setWorkLogHours] = useState<number>(0);
  const [workLogDesc, setWorkLogDesc] = useState('');

  // Zustandストアからフィルター条件を取得
  const {
    keyword,
    setKeyword,
    projectIds,
    setProjectIds,
    priorities,
    setPriorities,
    resetFilters,
  } = useTaskStore();

  // APIから全タスクを取得
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: taskApi.list,
  });

  const { data: projects = mockProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectApi.list,
  });

  const { data: users = mockUsers } = useQuery({
    queryKey: ['users'],
    queryFn: userApi.list,
  });

  // タスク作成のミューテーション（エラーハンドリングを追加）
  const createTaskMutation = useMutation({
    mutationFn: taskApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsCreateModalOpen(false);
      resetCreateForm();
    },
    onError: (error) => {
      alert('タスク起票に失敗しました。入力パラメータが不正か、サーバーに問題があります。\nエラー: ' + error.message);
    }
  });

  // タスク更新のミューテーション（エラーハンドリングを追加）
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTaskDto }) => taskApi.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['histories', variables.id] });
      setSelectedTask(null);
    },
    onError: (error) => {
      alert('タスク更新に失敗しました。\nエラー: ' + error.message);
    }
  });

  // コメント・工数・履歴のデータ取得
  const { data: comments = [] } = useQuery({
    queryKey: ['comments', selectedTask?.id],
    queryFn: () => commentApi.list(selectedTask!.id),
    enabled: !!selectedTask,
  });

  const { data: workLogs = [] } = useQuery({
    queryKey: ['workLogs', selectedTask?.id],
    queryFn: () => workLogApi.list(selectedTask!.id),
    enabled: !!selectedTask,
  });

  const { data: histories = [] } = useQuery({
    queryKey: ['histories', selectedTask?.id],
    queryFn: () => historyApi.list(selectedTask!.id),
    enabled: !!selectedTask,
  });

  // コメント作成のミューテーション
  const createCommentMutation = useMutation({
    mutationFn: ({ taskId, userId, content }: { taskId: string; userId: string; content: string }) =>
      commentApi.create(taskId, userId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', selectedTask?.id] });
      setCommentText('');
    },
    onError: (error) => {
      alert('コメント追加に失敗しました。\nエラー: ' + error.message);
    }
  });

  // 工数追加のミューテーション
  const createWorkLogMutation = useMutation({
    mutationFn: ({ taskId, userId, loggedDate, hours, description }: { taskId: string; userId: string; loggedDate: string; hours: number; description?: string }) =>
      workLogApi.create(taskId, userId, loggedDate, hours, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workLogs', selectedTask?.id] });
      setWorkLogHours(0);
      setWorkLogDesc('');
    },
    onError: (error) => {
      alert('工数記録に失敗しました。\nエラー: ' + error.message);
    }
  });

  const resetCreateForm = () => {
    setNewTitle('');
    setNewDesc('');
    setNewProj(mockProjects[0].id);
    setNewCat(mockCategories[0].id);
    setNewPriority('MEDIUM');
    setNewEstimate(0);
    setNewStartDate('');
    setNewEndDate('');
  };

  const handleOpenEditModal = (task: Task) => {
    setSelectedTask(task);
    setActiveTab('info'); // モーダルを開いたときは基本情報タブにする
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditProj(task.projectId);
    setEditCat(task.categoryId);
    setEditPriority(task.priority);
    setEditStatus(task.progressState);
    setEditEstimate(task.estimatedHours || 0);
    setEditStartDate(task.plannedStartDate ? new Date(task.plannedStartDate).toISOString().split('T')[0] : '');
    setEditEndDate(task.plannedEndDate ? new Date(task.plannedEndDate).toISOString().split('T')[0] : '');
    setEditAssignee(task.assignedUserId || '');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTaskMutation.mutate({
      title: newTitle,
      description: newDesc || undefined,
      projectId: newProj,
      categoryId: newCat,
      priority: newPriority,
      estimatedHours: newEstimate || undefined,
      plannedStartDate: newStartDate || undefined,
      plannedEndDate: newEndDate || undefined,
      createdBy: '00000000-0000-0000-0000-000000000401', // マネージャー想定の固定UUID
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    updateTaskMutation.mutate({
      id: selectedTask.id,
      dto: {
        title: editTitle,
        description: editDesc || undefined,
        projectId: editProj,
        categoryId: editCat,
        priority: editPriority,
        progressState: editStatus,
        estimatedHours: editEstimate || undefined,
        plannedStartDate: editStartDate || undefined,
        plannedEndDate: editEndDate || undefined,
        assignedUserId: editAssignee || undefined,
        changedBy: '00000000-0000-0000-0000-000000000401', // マネージャーによる更新と仮定
      },
    });
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !commentText.trim()) return;
    createCommentMutation.mutate({
      taskId: selectedTask.id,
      userId: '00000000-0000-0000-0000-000000000401', // ログインユーザーをSatoshi Managerと仮定
      content: commentText.trim(),
    });
  };

  const handleWorkLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || workLogHours <= 0) return;
    createWorkLogMutation.mutate({
      taskId: selectedTask.id,
      userId: '00000000-0000-0000-0000-000000000401', // ログインユーザーをSatoshi Managerと仮定
      loggedDate: workLogDate,
      hours: workLogHours,
      description: workLogDesc || undefined,
    });
  };

  const renderHistoryDetails = (history: TaskHistory) => {
    if (history.actionType === 'CREATE' || !history.beforePayload) {
      return 'タスクを起票しました。';
    }

    const changes: string[] = [];
    const before = history.beforePayload || {};
    const after = history.afterPayload || {};

    const translateKey = (key: string) => {
      switch (key) {
        case 'title': return 'タスク名';
        case 'description': return '説明';
        case 'progressState': return 'ステータス';
        case 'priority': return '優先度';
        case 'estimatedHours': return '見積もり工数';
        case 'assignedUserId': return '担当者';
        case 'projectId': return 'プロジェクト';
        case 'categoryId': return 'カテゴリ';
        case 'ticketId': return 'チケットID';
        case 'plannedStartDate': return '計画開始日';
        case 'plannedEndDate': return '計画終了日';
        default: return key;
      }
    };

    const translateValue = (key: string, val: unknown) => {
      if (val === null || val === undefined || val === '') return '未設定';
      if (key === 'progressState') {
        switch (val) {
          case 'BACKLOG': return '未着手';
          case 'IN_PROGRESS': return '進行中';
          case 'IN_REVIEW': return 'レビュー中';
          case 'DONE': return '完了';
          default: return String(val);
        }
      }
      if (key === 'priority') {
        switch (val) {
          case 'HIGH': return '高';
          case 'MEDIUM': return '中';
          case 'LOW': return '低';
          default: return String(val);
        }
      }
      if (key === 'assignedUserId') {
        const u = users.find((user: User) => user.id === val);
        return u ? u.name : '未割り当て';
      }
      if (key === 'projectId') {
        const p = projects.find((proj: Project) => proj.id === val);
        return p ? p.name : '未設定';
      }
      if (key === 'categoryId') {
        const c = mockCategories.find((cat: { id: string; name: string }) => cat.id === val);
        return c ? c.name : '未設定';
      }
      if (key === 'plannedStartDate' || key === 'plannedEndDate') {
        return typeof val === 'string' ? val.split('T')[0] : String(val);
      }
      return String(val);
    };

    const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

    allKeys.forEach((key) => {
      if (before[key] !== after[key]) {
        changes.push(
          `${translateKey(key)} を 「${translateValue(key, before[key])}」 から 「${translateValue(key, after[key])}」 に変更しました`
        );
      }
    });

    if (changes.length === 0) return '変更を保存しました。';
    return changes.join('、 ');
  };

  // クライアントサイドでのフィルタリング処理
  const filteredTasks = tasks.filter(task => {
    // 担当タスク / 起票タスク フィルター
    if (taskScopeFilter === 'ASSIGNED' && task.assignedUserId !== currentUser?.id) {
      return false;
    }
    if (taskScopeFilter === 'CREATED' && task.createdBy !== currentUser?.id) {
      return false;
    }
    // キーワード検索 (タイトル or 説明文)
    if (keyword && !task.title.toLowerCase().includes(keyword.toLowerCase()) && !task.description?.toLowerCase().includes(keyword.toLowerCase())) {
      return false;
    }
    // プロジェクトフィルター
    if (projectIds.length > 0 && !projectIds.includes(task.projectId)) {
      return false;
    }
    // 優先度フィルター
    if (priorities.length > 0 && !priorities.includes(task.priority)) {
      return false;
    }
    return true;
  });

  // かんばんボード用のカラム定義
  const columns: { id: TaskProgressState; label: string; bg: string; text: string }[] = [
    { id: 'BACKLOG', label: '未着手', bg: 'bg-slate-100', text: 'text-slate-700' },
    { id: 'IN_PROGRESS', label: '進行中', bg: 'bg-indigo-50/70', text: 'text-indigo-800' },
    { id: 'IN_REVIEW', label: 'レビュー中', bg: 'bg-amber-50/70', text: 'text-amber-800' },
    { id: 'DONE', label: '完了', bg: 'bg-emerald-50/70', text: 'text-emerald-800' },
  ];

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'LOW': return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* 上部コントロールエリア */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* 統一フィルター UI (セグメントボタン: 全体 / 自分が担当 / 自分が起票) */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setTaskScopeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                taskScopeFilter === 'ALL' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              👥 全体タスク
            </button>
            <button
              onClick={() => setTaskScopeFilter('ASSIGNED')}
              data-testid="filter-my-kanban"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                taskScopeFilter === 'ASSIGNED' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              👤 自分が担当
            </button>
            <button
              onClick={() => setTaskScopeFilter('CREATED')}
              data-testid="filter-created-kanban"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                taskScopeFilter === 'CREATED' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📝 自分が起票
            </button>
          </div>

          {/* キーワード入力 */}
          <input
            type="text"
            placeholder="タスク名・説明で検索..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />

          {/* プロジェクトフィルター */}
          <select
            value={projectIds[0] || ''}
            onChange={(e) => setProjectIds(e.target.value ? [e.target.value] : [])}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">すべてのプロジェクト</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          {/* 優先度フィルター */}
          <select
            value={priorities[0] || ''}
            onChange={(e) => setPriorities(e.target.value ? [e.target.value as TaskPriority] : [])}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">すべての優先度</option>
            <option value="HIGH">高優先</option>
            <option value="MEDIUM">中優先</option>
            <option value="LOW">低優先</option>
          </select>

          {(keyword || projectIds.length > 0 || priorities.length > 0) && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              フィルター解除
            </button>
          )}
        </div>

        <button
          data-testid="create-task-button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 py-2.5 px-5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition rounded-xl shadow-md shadow-indigo-600/10"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          タスクを追加
        </button>
      </div>

      {/* かんばんボード */}
      {isLoading ? (
        <div className="text-center py-20 text-slate-500 font-medium">ロード中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {columns.map((col) => {
            const columnTasks = filteredTasks.filter(t => t.progressState === col.id);
            return (
              <div key={col.id} className="bg-slate-100/70 p-4 rounded-2xl flex flex-col border border-slate-200/50">
                {/* カラムヘッダー */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className={`text-sm font-bold ${col.text}`}>{col.label}</span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>

                {/* カードエリア */}
                <div className="space-y-3 min-h-[400px]">
                  {columnTasks.map((task) => {
                    const project = projects.find(p => p.id === task.projectId);
                    return (
                      <div
                        key={task.id}
                        onClick={() => handleOpenEditModal(task)}
                        className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                      >
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-extrabold border rounded-md mb-2 ${getPriorityColor(task.priority)}`}>
                          {task.priority === 'HIGH' ? '高' : task.priority === 'MEDIUM' ? '中' : '低'}
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition mb-3">
                          {task.title}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                          <span className="font-semibold text-slate-500 truncate max-w-[120px]">
                            {project?.name || '共通設定'}
                          </span>
                          {task.plannedEndDate && (
                            <span>{new Date(task.plannedEndDate).toLocaleDateString().slice(5)}まで</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {columnTasks.length === 0 && (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl py-8 text-center text-xs text-slate-400 font-medium select-none">
                      タスクはありません
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* タスク追加モーダル */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">新規タスク起票</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">タスク名</label>
                <input
                  data-testid="task-title-input"
                  type="text"
                  required
                  placeholder="例: フロントエンドのAPI繋ぎ込み"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">説明</label>
                <textarea
                  data-testid="task-desc-input"
                  placeholder="詳細な要件やメモ..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">プロジェクト</label>
                  <select
                    value={newProj}
                    onChange={(e) => setNewProj(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  >
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">カテゴリ</label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  >
                    {mockCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">優先度</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  >
                    <option value="HIGH">高</option>
                    <option value="MEDIUM">中</option>
                    <option value="LOW">低</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">見積もり工数 (時間)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newEstimate}
                    onChange={(e) => setNewEstimate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">計画開始日</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">計画終了日</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
                >
                  キャンセル
                </button>
                <button
                  data-testid="submit-create-task-button"
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  {createTaskMutation.isPending ? '作成中...' : '起票する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* タスク編集・詳細モーダル */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-100 animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">タスク詳細・編集</h3>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* タブナビゲーション */}
            <div className="px-6 bg-slate-50 border-b border-slate-100 flex gap-4 text-xs font-bold text-slate-500 uppercase">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`py-3 border-b-2 transition-all ${activeTab === 'info' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-800'}`}
              >
                基本情報
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('worklog')}
                className={`py-3 border-b-2 transition-all ${activeTab === 'worklog' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-800'}`}
              >
                実績工数 ({workLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('comments')}
                className={`py-3 border-b-2 transition-all ${activeTab === 'comments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-800'}`}
              >
                コメント ({comments.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`py-3 border-b-2 transition-all ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-800'}`}
              >
                変更履歴 ({histories.length})
              </button>
            </div>

            {/* 基本情報タブ */}
            {activeTab === 'info' && (
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">タスク名</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">説明</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">プロジェクト</label>
                    <select
                      value={editProj}
                      onChange={(e) => setEditProj(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                    >
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">カテゴリ</label>
                    <select
                      value={editCat}
                      onChange={(e) => setEditCat(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                    >
                      {mockCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">優先度</label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                    >
                      <option value="HIGH">高</option>
                      <option value="MEDIUM">中</option>
                      <option value="LOW">低</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">ステータス</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as TaskProgressState)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-semibold"
                    >
                      <option value="BACKLOG">未着手</option>
                      <option value="IN_PROGRESS">進行中</option>
                      <option value="IN_REVIEW">レビュー中</option>
                      <option value="DONE">完了</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">担当者</label>
                    <select
                      data-testid="edit-assignee-select"
                      value={editAssignee}
                      onChange={(e) => setEditAssignee(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                    >
                      <option value="">未割り当て</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">見積もり時間</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editEstimate}
                      onChange={(e) => setEditEstimate(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">計画開始日</label>
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">計画終了日</label>
                    <input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTask(null)}
                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
                  >
                    キャンセル
                  </button>
                  <button
                    data-testid="submit-edit-task-button"
                    type="submit"
                    disabled={updateTaskMutation.isPending}
                    className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                  >
                    {updateTaskMutation.isPending ? '更新中...' : '保存する'}
                  </button>
                </div>
              </form>
            )}

            {/* 実績工数タブ */}
            {activeTab === 'worklog' && (
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase">合計実績時間</span>
                    <p className="text-2xl font-black text-indigo-600">{workLogs.reduce((sum, l) => sum + l.hours, 0)} <span className="text-sm font-normal text-slate-500">時間</span></p>
                  </div>
                  {selectedTask.estimatedHours && (
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-500 uppercase">見積もり時間</span>
                      <p className="text-lg font-bold text-slate-700">{selectedTask.estimatedHours} 時間</p>
                    </div>
                  )}
                </div>

                <div className="max-h-[160px] overflow-y-auto space-y-2 border border-slate-100 p-2 rounded-xl">
                  {workLogs.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">工数記録はまだありません。</p>
                  ) : (
                    workLogs.map((log) => (
                      <div key={log.id} className="text-sm bg-white p-3 rounded-lg border border-slate-100 flex justify-between items-start gap-2 shadow-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">{log.userName || '開発メンバー'}</span>
                            <span className="text-xs text-slate-400">{log.loggedDate.split('T')[0]}</span>
                          </div>
                          {log.description && <p className="text-xs text-slate-500 mt-1">{log.description}</p>}
                        </div>
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg text-xs">{log.hours}h</span>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleWorkLogSubmit} className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-sm font-bold text-slate-800">工数を記録する</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">日付</label>
                      <input
                        type="date"
                        required
                        value={workLogDate}
                        onChange={(e) => setWorkLogDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">作業時間 (時間)</label>
                      <input
                        type="number"
                        step="0.25"
                        min="0.25"
                        required
                        value={workLogHours || ''}
                        onChange={(e) => setWorkLogHours(parseFloat(e.target.value) || 0)}
                        placeholder="例: 1.5"
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">作業内容</label>
                    <input
                      type="text"
                      placeholder="何を行いましたか？ (任意)"
                      value={workLogDesc}
                      onChange={(e) => setWorkLogDesc(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200"
                    />
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={createWorkLogMutation.isPending}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                    >
                      {createWorkLogMutation.isPending ? '保存中...' : '工数を登録'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* コメントタブ */}
            {activeTab === 'comments' && (
              <div className="p-6 space-y-4">
                <div className="max-h-[220px] overflow-y-auto space-y-3 pr-1">
                  {comments.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">コメントはまだありません。</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="text-sm bg-slate-50/50 p-3 rounded-2xl border border-slate-100/70">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800">{comment.userName || '開発メンバー'}</span>
                          <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleString('ja-JP')}</span>
                        </div>
                        <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleCommentSubmit} className="pt-4 border-t border-slate-100 space-y-3">
                  <textarea
                    required
                    placeholder="コメントを入力してください..."
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={createCommentMutation.isPending}
                      className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                    >
                      {createCommentMutation.isPending ? '送信中...' : 'コメントを投稿'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 変更履歴タブ */}
            {activeTab === 'history' && (
              <div className="p-6">
                <div className="max-h-[320px] overflow-y-auto space-y-4 pr-1">
                  {histories.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-12">変更履歴はありません。</p>
                  ) : (
                    histories.map((h) => (
                      <div key={h.id} className="relative pl-6 border-l-2 border-slate-100 pb-2 last:pb-0">
                        <div className="absolute -left-[6px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white" />
                        <div className="text-xs text-slate-400 mb-1">
                          <span className="font-semibold text-slate-700 mr-2">{h.changedByName || '開発メンバー'}</span>
                          {new Date(h.changedAt).toLocaleString('ja-JP')}
                        </div>
                        <p className="text-sm text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 leading-relaxed">
                          {renderHistoryDetails(h)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

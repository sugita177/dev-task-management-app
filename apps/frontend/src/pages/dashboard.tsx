import { useQuery } from '@tanstack/react-query';
import { taskApi } from '../api/task-api';
import type { Task, TaskProgressState, TaskPriority } from '../types/task';

// モックデータ (APIが空の場合にダッシュボードをリッチにする用)
const mockStats = {
  activeCount: 12,
  inReviewCount: 3,
  overdueCount: 2,
  completedRate: 75,
  completedCount: 36,
  totalHours: 120,
  actualHours: 92,
};

// Task 型に厳密に準拠したモックデータを作成
const mockRecentTasks: Task[] = [
  {
    id: '1',
    title: '認証機能の結合テスト作成',
    projectId: 'proj-1',
    progressState: 'IN_PROGRESS',
    categoryId: 'cat-1',
    priority: 'HIGH',
    plannedEndDate: '2026-07-20',
    createdBy: 'user-1',
    createdAt: '2026-07-10T00:00:00Z',
    updatedAt: '2026-07-12T00:00:00Z',
  },
  {
    id: '2',
    title: 'ダッシュボードUIのコーディング',
    projectId: 'proj-2',
    progressState: 'IN_REVIEW',
    categoryId: 'cat-2',
    priority: 'MEDIUM',
    plannedEndDate: '2026-07-16',
    createdBy: 'user-1',
    createdAt: '2026-07-10T00:00:00Z',
    updatedAt: '2026-07-12T00:00:00Z',
  },
  {
    id: '3',
    title: 'DBインデックスの最適化',
    projectId: 'proj-3',
    progressState: 'BACKLOG',
    categoryId: 'cat-3',
    priority: 'LOW',
    plannedEndDate: '2026-07-28',
    createdBy: 'user-1',
    createdAt: '2026-07-10T00:00:00Z',
    updatedAt: '2026-07-12T00:00:00Z',
  },
];

export default function Dashboard() {
  // APIから実際のタスク一覧を取得する
  const { data: realTasks } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: taskApi.list,
  });

  // リアルデータの統計情報を計算
  const hasRealTasks = realTasks && realTasks.length > 0;
  const stats = {
    activeCount: hasRealTasks ? realTasks.filter(t => t.progressState === 'IN_PROGRESS').length : mockStats.activeCount,
    inReviewCount: hasRealTasks ? realTasks.filter(t => t.progressState === 'IN_REVIEW').length : mockStats.inReviewCount,
    overdueCount: mockStats.overdueCount, // MVPではモック
    completedRate: mockStats.completedRate,
    actualHours: mockStats.actualHours,
    totalHours: mockStats.totalHours,
  };

  // 表示するタスク一覧
  const tasksToShow: Task[] = hasRealTasks ? realTasks.slice(0, 3) : mockRecentTasks;

  const getStatusBadge = (status: TaskProgressState) => {
    switch (status) {
      case 'BACKLOG': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">未着手</span>;
      case 'IN_PROGRESS': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">進行中</span>;
      case 'IN_REVIEW': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-600 border border-amber-200">レビュー中</span>;
      case 'DONE': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">完了</span>;
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH': return <span className="px-2 py-0.5 text-xs font-bold text-rose-600 bg-rose-50 rounded">高</span>;
      case 'MEDIUM': return <span className="px-2 py-0.5 text-xs font-bold text-amber-600 bg-amber-50 rounded">中</span>;
      case 'LOW': return <span className="px-2 py-0.5 text-xs font-bold text-slate-500 bg-slate-50 rounded">低</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* 歓迎セクション */}
      <div className="relative p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white overflow-hidden shadow-lg">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-300 via-indigo-600 to-indigo-900 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold tracking-wide">おかえりなさい、Satoshi さん</h2>
          <p className="mt-1 text-sm text-indigo-200 font-medium">現在、12件のアクティブなタスクが進行中です。本日も頑張りましょう！</p>
        </div>
      </div>

      {/* KPIカード群 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">進行中のタスク</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-800">{stats.activeCount}</span>
            <span className="text-xs text-slate-400 ml-2">件</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">レビュー待ち</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-800">{stats.inReviewCount}</span>
            <span className="text-xs text-slate-400 ml-2">件</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">期限超過（アラート）</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-rose-600">{stats.overdueCount}</span>
            <span className="text-xs text-rose-400 ml-2">件</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">進捗消化率</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-end justify-between">
              <span className="text-2xl font-extrabold text-slate-800">{stats.completedRate}%</span>
              <span className="text-xs text-slate-400">{stats.actualHours}/{stats.totalHours}h</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${stats.completedRate}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* ウィジェットエリア */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 直近のタスクリスト（左側2/3） */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-800 text-lg">直近期限のタスク</h3>
            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition">すべて見る →</button>
          </div>

          <div className="divide-y divide-slate-100">
            {tasksToShow.map((task) => (
              <div key={task.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-xl transition">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-800 text-sm hover:text-indigo-600 cursor-pointer">{task.title}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-medium text-slate-500">プロジェクト-{task.projectId}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {task.plannedEndDate ? new Date(task.plannedEndDate).toLocaleDateString() : '未設定'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getPriorityBadge(task.priority)}
                  {getStatusBadge(task.progressState)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 活動ログ風ウィジェット（右側1/3） */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-800 text-lg">最近のアクティビティ</h3>
          </div>

          <div className="space-y-5">
            <div className="flex gap-3 text-sm">
              <div className="w-2.5 h-2.5 mt-1.5 rounded-full bg-indigo-500 shrink-0"></div>
              <div>
                <p className="text-slate-800 font-medium">田中さんがタスクを完了に更新</p>
                <p className="text-xs text-slate-400 mt-0.5">30分前 • API設計</p>
              </div>
            </div>
            <div className="flex gap-3 text-sm">
              <div className="w-2.5 h-2.5 mt-1.5 rounded-full bg-amber-500 shrink-0"></div>
              <div>
                <p className="text-slate-800 font-medium">鈴木さんがチケットを起票</p>
                <p className="text-xs text-slate-400 mt-0.5">2時間前 • 障害対応</p>
              </div>
            </div>
            <div className="flex gap-3 text-sm">
              <div className="w-2.5 h-2.5 mt-1.5 rounded-full bg-slate-300 shrink-0"></div>
              <div>
                <p className="text-slate-800 font-medium">ミーティング資料を追加</p>
                <p className="text-xs text-slate-400 mt-0.5">昨日 • 進捗報告</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

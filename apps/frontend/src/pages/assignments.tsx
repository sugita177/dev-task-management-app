import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { taskApi, projectApi, userApi } from '../api/task-api';
import type { Task, TaskProgressState } from '../types/task';

// モックユーザーデータ定義 (IDはtask-list.tsxのUUID形式と共通化)
const mockUsers = [
  { id: '00000000-0000-0000-0000-000000000401', name: 'Satoshi Manager', role: 'PM / 設計', initials: 'SM', maxHours: 40 },
  { id: '00000000-0000-0000-0000-000000000402', name: '田中 太郎', role: 'シニアエンジニア', initials: 'TT', maxHours: 40 },
  { id: '00000000-0000-0000-0000-000000000403', name: '鈴木 一郎', role: 'ジュニアエンジニア', initials: 'JI', maxHours: 40 },
];

const mockProjects = [
  { id: '00000000-0000-0000-0000-000000000201', name: '認証基盤システム' },
  { id: '00000000-0000-0000-0000-000000000202', name: 'DevTaskApp' },
  { id: '00000000-0000-0000-0000-000000000203', name: '共通APIサービス' },
];

type PeriodFilter = 'THIS_WEEK' | 'THIS_MONTH' | 'ALL';

export default function Assignments() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('THIS_WEEK');

  // バックエンドからタスク一覧を取得
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: taskApi.list,
  });

  const { data: rawUsers = mockUsers } = useQuery({
    queryKey: ['users'],
    queryFn: userApi.list,
  });

  const { data: projects = mockProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectApi.list,
  });

  const getInitials = (name: string) => name.split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2) || 'U';

  const getRoleLabel = (role: any) => {
    if (typeof role === 'object' && role) {
      switch (role.name) {
        case 'ADMINISTRATOR': return '管理者';
        case 'ENGINEER': return 'エンジニア';
        case 'BUSINESS': return 'ビジネスサイド';
        default: return role.name;
      }
    }
    return role || '開発メンバー';
  };

  const users = rawUsers.map(u => ({
    ...u,
    initials: (u as any).initials || getInitials(u.name),
    role: getRoleLabel((u as any).role),
    maxHours: (u as any).maxHours || 40,
  }));

  // 期間計算ヘルパー
  const getPeriodRange = (period: PeriodFilter) => {
    const now = new Date();
    if (period === 'THIS_WEEK') {
      const start = new Date(now);
      const day = start.getDay();
      const diffToMonday = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diffToMonday);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end, label: '今週 (月〜日)', maxHoursMultiplier: 1 };
    }
    if (period === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { start, end, label: '今月 (1日〜末日)', maxHoursMultiplier: 4 };
    }
    return { start: null, end: null, label: '全期間 (積算工数)', maxHoursMultiplier: 1 };
  };

  const range = getPeriodRange(selectedPeriod);

  // 期間内での実効割り当て工数を日割計算するロジック
  const calculateEffectiveTaskHours = (task: Task) => {
    if (!range.start || !range.end) {
      return task.estimatedHours || 0;
    }
    if (!task.estimatedHours) return 0;

    const taskStart = task.plannedStartDate ? new Date(task.plannedStartDate) : new Date();
    const taskEnd = task.plannedEndDate ? new Date(task.plannedEndDate) : new Date(taskStart.getTime() + 7 * 86400000);

    const totalDays = Math.max(1, Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const dailyHours = task.estimatedHours / totalDays;

    const overlapStart = new Date(Math.max(taskStart.getTime(), range.start.getTime()));
    const overlapEnd = new Date(Math.min(taskEnd.getTime(), range.end.getTime()));

    if (overlapStart > overlapEnd) return 0; // 重なりなし

    const overlapDays = Math.max(1, Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    return Math.round(dailyHours * overlapDays * 10) / 10;
  };

  // 未割り当てタスク
  const unassignedTasks = tasks.filter(t => !t.assignedUserId && t.progressState !== 'DONE');

  const getLoadLevel = (hours: number, maxCapacity: number) => {
    if (selectedPeriod === 'ALL') {
      return { label: 'タスク集計', color: 'text-indigo-600 bg-indigo-50 border-indigo-200', barColor: 'bg-indigo-500' };
    }
    if (hours > maxCapacity) return { label: '過負荷 (危険)', color: 'text-rose-600 bg-rose-50 border-rose-200', barColor: 'bg-rose-500' };
    if (hours >= maxCapacity * 0.5) return { label: '適正 (稼働中)', color: 'text-amber-600 bg-amber-50 border-amber-200', barColor: 'bg-amber-500' };
    return { label: '余裕あり', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', barColor: 'bg-emerald-500' };
  };

  const getStatusLabel = (state: TaskProgressState) => {
    switch (state) {
      case 'BACKLOG': return <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-500 rounded border border-slate-200">未着手</span>;
      case 'IN_PROGRESS': return <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-600 rounded border border-indigo-200">進行中</span>;
      case 'IN_REVIEW': return <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-600 rounded border border-amber-200">レビュー中</span>;
      case 'DONE': return <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-600 rounded border border-emerald-200">完了</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* 説明 & 期間選択フィルターパネル */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">メンバーアサイン状況 (キャパシティ分析)</h3>
          <p className="text-xs text-slate-500">
            選択した期間（日割計算）における各メンバーの稼働負荷を自動解析し、リソースのボトルネックや過負荷を早期検出します。
          </p>
        </div>

        {/* 期間切り替えセグメントコントローラー */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setSelectedPeriod('THIS_WEEK')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${selectedPeriod === 'THIS_WEEK' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            今週
          </button>
          <button
            onClick={() => setSelectedPeriod('THIS_MONTH')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${selectedPeriod === 'THIS_MONTH' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            今月
          </button>
          <button
            onClick={() => setSelectedPeriod('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${selectedPeriod === 'ALL' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            全期間 (総積算)
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-500 font-medium">ロード中...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* 左・中央側：アサイン済みメンバー負荷一覧 (2/3幅) */}
          <div className="lg:col-span-2 space-y-6">
            {users.map((user) => {
              const userTasks = tasks.filter(t => t.assignedUserId === user.id && t.progressState !== 'DONE');
              const maxCapacity = user.maxHours * range.maxHoursMultiplier;

              // 期間内の実効アサイン工数の集計
              const totalHours = Math.round(
                userTasks.reduce((sum, t) => sum + calculateEffectiveTaskHours(t), 0) * 10
              ) / 10;

              const load = getLoadLevel(totalHours, maxCapacity);
              const loadPercent = selectedPeriod === 'ALL'
                ? Math.min(100, (totalHours / 160) * 100)
                : Math.min(100, (totalHours / maxCapacity) * 100);

              return (
                <div key={user.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
                  {/* ヘッダー: メンバープロフィールと負荷レベル */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-base border-2 border-indigo-500 shadow-sm">
                        {user.initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">{user.name}</h4>
                        <span className="text-xs text-slate-400 font-medium">{user.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-bold border rounded-full ${load.color}`}>
                        {load.label}
                      </span>
                      <span className="text-sm font-extrabold text-slate-800">
                        {selectedPeriod === 'ALL' ? (
                          <>{totalHours}h <span className="text-xs font-normal text-slate-400">(全タスク合計)</span></>
                        ) : (
                          <>{totalHours} / {maxCapacity}h <span className="text-xs font-normal text-slate-400">({range.label})</span></>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* 負荷プログレスバー */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${load.barColor}`} style={{ width: `${loadPercent}%` }}></div>
                    </div>
                  </div>

                  {/* アサイン中タスクの内訳アコーディオン/リスト */}
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      アクティブタスク ({userTasks.length}件)
                    </p>
                    {userTasks.length > 0 ? (
                      <div className="space-y-2">
                        {userTasks.map(task => {
                          const project = projects.find(p => p.id === task.projectId);
                          const effectiveHours = calculateEffectiveTaskHours(task);
                          return (
                            <div key={task.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition">
                              <div className="space-y-0.5 truncate max-w-[65%]">
                                <p className="text-sm font-semibold text-slate-700 truncate">{task.title}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{project?.name || 'タスク管理アプリ'}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                  {effectiveHours}h <span className="text-[9px] text-slate-400 font-normal">/ {task.estimatedHours || 0}h</span>
                                </span>
                                {getStatusLabel(task.progressState)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">アサイン中のタスクはありません</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 右側：未割り当てタスクリスト（1/3幅） */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm">未割り当てタスク ({unassignedTasks.length})</h4>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              メンバーへの割り当て（アサイン）が完了していないタスクです。かんばんボードから担当者を設定できます。
            </p>

            <div className="space-y-3 pt-2">
              {unassignedTasks.map(task => {
                const project = projects.find(p => p.id === task.projectId);
                return (
                  <div key={task.id} className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/20 hover:bg-rose-50/40 transition-colors flex flex-col gap-2">
                    <span className="font-bold text-slate-700 text-xs leading-normal">{task.title}</span>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-500 truncate max-w-[120px]">{project?.name || '共通設定'}</span>
                      <span className="font-bold text-rose-600">{task.estimatedHours || 0}h</span>
                    </div>
                  </div>
                );
              })}

              {unassignedTasks.length === 0 && (
                <div className="border border-dashed border-slate-200 rounded-xl py-8 text-center text-xs text-slate-400 font-medium select-none">
                  未割り当てのタスクはありません
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

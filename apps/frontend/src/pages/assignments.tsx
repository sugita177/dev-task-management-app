import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { taskApi, projectApi, userApi } from '../api/task-api';
import { useAuthStore } from '../store/auth-store';
import type { Task, TaskProgressState, User, Role } from '../types/task';

// モックユーザーデータ定義 (IDはtask-list.tsxのUUID形式と共通化)
const mockUsers: User[] = [
  { id: '00000000-0000-0000-0000-000000000401', name: 'Satoshi Manager', email: 'satoshi@example.com', role: 'PM / 設計', initials: 'SM', maxHours: 40 },
  { id: '00000000-0000-0000-0000-000000000402', name: '田中 太郎', email: 'tanaka@example.com', role: 'シニアエンジニア', initials: 'TT', maxHours: 40 },
  { id: '00000000-0000-0000-0000-000000000403', name: '鈴木 一郎', email: 'suzuki@example.com', role: 'ジュニアエンジニア', initials: 'JI', maxHours: 40 },
];

const mockProjects = [
  { id: '00000000-0000-0000-0000-000000000201', name: '認証基盤システム' },
  { id: '00000000-0000-0000-0000-000000000202', name: 'DevTaskApp' },
  { id: '00000000-0000-0000-0000-000000000203', name: '共通APIサービス' },
];

type PeriodFilter = 'THIS_WEEK' | 'THIS_MONTH' | 'ALL';

// 現時点の表示期間キャパシティ乗数（※Step 5で月の日数・営業日数に応じた動的算出へ拡張予定）
const AVERAGE_WEEKS_PER_MONTH = 4; // 1ヶ月 ≒ 4週間 (160h)
const TOTAL_DISPLAY_WEEKS = 8;     // 全期間表示 ≒ 8週間 (320h)

export default function Assignments() {
  const { user: currentUser } = useAuthStore();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('THIS_WEEK');
  const [filterMyAssignments, setFilterMyAssignments] = useState<boolean>(false);

  // バックエンドからタスク一覧を取得
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: taskApi.list,
  });

  const { data: rawUsers = mockUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: userApi.list,
  });

  const { data: projects = mockProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectApi.list,
  });

  const getInitials = (name: string) => name.split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2) || 'U';

  const getRoleLabel = (role: Role | string | undefined, roleName?: string): string => {
    // 1. オブジェクトのrole.name、またはroleName、または文字列roleからコード値（ENUM）を優先抽出
    const candidate = (typeof role === 'object' && role?.name) || roleName || (typeof role === 'string' ? role : undefined);

    switch (candidate) {
      case 'ADMINISTRATOR': return '管理者';
      case 'ENGINEERING_MANAGER': return 'マネージャー';
      case 'ENGINEER': return 'エンジニア';
      case 'BUSINESS': return 'ビジネスサイド';
      default:
        // マッチしない場合、モックデータの自由記述文字列（'PM / 設計'等）を返し、未設定なら'エンジニア'
        return typeof role === 'string' ? role : (typeof candidate === 'string' ? candidate : 'エンジニア');
    }
  };

  // メンバー表示用配列の生成
  const displayUsers = rawUsers.map((u) => {
    const userRoleLabel = getRoleLabel(u.role, u.roleName);
    const userInitials = u.initials || getInitials(u.name);
    return {
      id: u.id,
      name: u.name,
      role: userRoleLabel,
      initials: userInitials,
      maxHours: u.maxHours || 40,
    };
  });

  // 自分のみのフィルタリング処理
  const usersToRender = filterMyAssignments
    ? displayUsers.filter((u) => u.id === currentUser?.id || u.name === currentUser?.name)
    : displayUsers;

  // 期間計算ヘルパー (日割り按分)
  const calculateTaskHoursForPeriod = (task: Task, period: PeriodFilter): number => {
    const totalEst = task.estimatedHours || 5;
    if (!task.plannedStartDate || !task.plannedEndDate || period === 'ALL') {
      return totalEst;
    }

    const taskStart = new Date(task.plannedStartDate).getTime();
    const taskEnd = new Date(task.plannedEndDate).getTime();
    const taskDurationDays = Math.max(1, Math.round((taskEnd - taskStart) / (24 * 60 * 60 * 1000)) + 1);
    const hoursPerDay = totalEst / taskDurationDays;

    const now = new Date();
    let periodStart = new Date();
    let periodEnd = new Date();

    if (period === 'THIS_WEEK') {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      periodStart = new Date(now.setDate(diffToMonday));
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);
    } else if (period === 'THIS_MONTH') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const pStart = periodStart.getTime();
    const pEnd = periodEnd.getTime();
    const overlapStart = Math.max(taskStart, pStart);
    const overlapEnd = Math.min(taskEnd, pEnd);

    if (overlapEnd < overlapStart) {
      return 0;
    }

    const overlapDays = Math.round((overlapEnd - overlapStart) / (24 * 60 * 60 * 1000)) + 1;
    return Math.round(hoursPerDay * overlapDays * 10) / 10;
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
            選択した期間（日割計算）における各メンバーの稼働負荷を自動解析し、過負荷を早期検出します。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* 自分のみフィルター (統一デザイン) */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setFilterMyAssignments(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !filterMyAssignments ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              👥 全体表示
            </button>
            <button
              onClick={() => setFilterMyAssignments(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterMyAssignments ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              👤 自分の負荷のみ
            </button>
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
              全期間
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-500 font-medium">ロード中...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {usersToRender.map((usr) => {
            const userAssignedTasks = tasks.filter(t => t.assignedUserId === usr.id);
            const activeTasks = userAssignedTasks.filter(t => t.progressState !== 'DONE');

            const totalPeriodHours = activeTasks.reduce((sum, task) => {
              return sum + calculateTaskHoursForPeriod(task, selectedPeriod);
            }, 0);

            let maxCapacity = usr.maxHours;
            if (selectedPeriod === 'THIS_MONTH') maxCapacity = usr.maxHours * AVERAGE_WEEKS_PER_MONTH;
            if (selectedPeriod === 'ALL') maxCapacity = usr.maxHours * TOTAL_DISPLAY_WEEKS;

            const loadRate = Math.min(100, Math.round((totalPeriodHours / maxCapacity) * 100));
            const isOverloaded = totalPeriodHours > maxCapacity;

            return (
              <div
                key={usr.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                  isOverloaded ? 'border-rose-300 ring-1 ring-rose-500/20' : 'border-slate-200'
                }`}
              >
                {/* メンバーカードヘッダー */}
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                      {usr.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-base">{usr.name}</h4>
                        <span className="px-2 py-0.5 text-[10px] font-bold text-slate-500 bg-slate-100 rounded border border-slate-200">
                          {usr.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        アサイン済み: {userAssignedTasks.length}件 (未完了: {activeTasks.length}件)
                      </p>
                    </div>
                  </div>

                  {/* 負荷状況メーター */}
                  <div className="w-full md:w-72 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500">
                        {selectedPeriod === 'THIS_WEEK' ? '今週の予定負荷' : selectedPeriod === 'THIS_MONTH' ? '今月の予定負荷' : '全期間の予定負荷'}
                      </span>
                      <div className="flex items-center gap-1 font-bold">
                        <span className={isOverloaded ? 'text-rose-600 font-extrabold' : 'text-slate-800'}>
                          {totalPeriodHours}h
                        </span>
                        <span className="text-slate-400 font-normal">/ {maxCapacity}h</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOverloaded ? 'bg-rose-500 animate-pulse' : loadRate > 85 ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${loadRate}%` }}
                      ></div>
                    </div>

                    {isOverloaded && (
                      <p className="text-[11px] font-bold text-rose-500 flex items-center justify-end gap-1">
                        ⚠️ キャパシティ超過 ({Math.round(totalPeriodHours - maxCapacity)}h 超過)
                      </p>
                    )}
                  </div>
                </div>

                {/* アサインタスク一覧 */}
                <div className="p-6">
                  {userAssignedTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">アサインされたタスクはありません。</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userAssignedTasks.map((t) => {
                        const project = projects.find(p => p.id === t.projectId);
                        const periodHours = calculateTaskHoursForPeriod(t, selectedPeriod);

                        return (
                          <div
                            key={t.id}
                            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition flex flex-col justify-between space-y-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-semibold text-slate-400 truncate">
                                  {project?.name || 'タスク管理'}
                                </span>
                                {getStatusLabel(t.progressState)}
                              </div>
                              <h5 className="font-bold text-slate-800 text-sm leading-snug">{t.title}</h5>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                              <span>期間内算出: <strong className="text-slate-800 font-bold">{periodHours}h</strong></span>
                              <span>見積計: {t.estimatedHours || 5}h</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

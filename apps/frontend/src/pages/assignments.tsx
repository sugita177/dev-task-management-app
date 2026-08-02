import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { taskApi, userApi, projectApi } from '../api/task-api';
import { useAuthStore } from '../store/auth-store';
import type { Task, TaskProgressState, User, Project } from '../types/task';

// 表示用期間フィルター型
type PeriodFilter = 'THIS_WEEK' | 'THIS_MONTH' | 'ALL';

// ディスプレイ用デフォルト定数
const TOTAL_DISPLAY_WEEKS = 8;

// 月内の土日を除いた実働営業日数を動的算出する関数
const getBusinessDaysInMonth = (year: number, month: number): number => {
  let businessDays = 0;
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      businessDays++;
    }
    date.setDate(date.getDate() + 1);
  }
  return businessDays;
};

// 日本語の役職ラベル取得ヘルパー
const getRoleLabel = (roleName?: string) => {
  if (!roleName) return 'メンバー';
  if (roleName === 'ENGINEERING_MANAGER') return 'マネージャー';
  if (roleName === 'ENGINEER') return 'エンジニア';
  if (roleName === 'BUSINESS') return 'ビジネス';
  if (roleName === 'ADMINISTRATOR') return '管理者';
  return roleName;
};

// ユーザー名からイニシャルを自動生成するヘルパー
const getUserInitials = (user: User): string => {
  if (user.initials) return user.initials;
  if (!user.name) return 'U';
  const trimmed = user.name.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
};

export default function Assignments() {
  const { user: currentUser } = useAuthStore();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('THIS_WEEK');
  const [filterMyAssignments, setFilterMyAssignments] = useState<boolean>(false);

  // バックエンドからタスク一覧・ユーザー一覧・プロジェクト一覧を取得
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: taskApi.list,
  });

  const { data: displayUsers = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: userApi.list,
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: projectApi.list,
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

  // 1日8時間超過日の精緻計算 (US-EM-02)
  const calculateDailyOverloadDays = (userTasks: Task[], period: PeriodFilter): number => {
    const activeTasks = userTasks.filter((t) => t.progressState !== 'DONE' && t.plannedStartDate && t.plannedEndDate);
    if (activeTasks.length === 0) return 0;

    const now = new Date();
    let checkStart = new Date();
    let checkEnd = new Date();

    if (period === 'THIS_WEEK') {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      checkStart = new Date(now.setDate(diffToMonday));
      checkStart.setHours(0, 0, 0, 0);
      checkEnd = new Date(checkStart);
      checkEnd.setDate(checkStart.getDate() + 6);
      checkEnd.setHours(23, 59, 59, 999);
    } else if (period === 'THIS_MONTH') {
      checkStart = new Date(now.getFullYear(), now.getMonth(), 1);
      checkEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      // ALL
      checkStart = new Date(now.getFullYear(), now.getMonth(), 1);
      checkEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59, 999);
    }

    let overloadedDaysCount = 0;
    const curr = new Date(checkStart);
    while (curr <= checkEnd) {
      // 土日を除外して判定
      const dayOfWeek = curr.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const currTime = curr.getTime();
        let dayTotalHours = 0;

        for (const task of activeTasks) {
          const tStart = new Date(task.plannedStartDate!).getTime();
          const tEnd = new Date(task.plannedEndDate!).getTime();

          if (currTime >= tStart && currTime <= tEnd) {
            const taskDurationDays = Math.max(1, Math.round((tEnd - tStart) / (24 * 60 * 60 * 1000)) + 1);
            const dailyHours = (task.estimatedHours || 5) / taskDurationDays;
            dayTotalHours += dailyHours;
          }
        }

        if (dayTotalHours > 8.0) {
          overloadedDaysCount++;
        }
      }
      curr.setDate(curr.getDate() + 1);
    }

    return overloadedDaysCount;
  };

  const getStatusLabel = (state: TaskProgressState) => {
    switch (state) {
      case 'BACKLOG': return <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-500 rounded border border-slate-200">未着手</span>;
      case 'IN_PROGRESS': return <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-600 rounded border border-indigo-200">進行中</span>;
      case 'IN_REVIEW': return <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-600 rounded border border-amber-200">レビュー中</span>;
      case 'DONE': return <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-600 rounded border border-emerald-200">完了</span>;
    }
  };

  const now = new Date();
  const actualBusinessDaysInMonth = getBusinessDaysInMonth(now.getFullYear(), now.getMonth());

  return (
    <div className="space-y-8">
      {/* 説明 & 期間選択フィルターパネル */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">メンバーアサイン状況 (キャパシティ分析)</h3>
          <p className="text-xs text-slate-500">
            実カレンダー（当月 {actualBusinessDaysInMonth} 営業日）と日割り按分により、局所的な過負荷（1日8h超）を精緻検出します。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* 統一フィルター UI (セグメントボタン) */}
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

          {/* 期間切替フィルター */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setSelectedPeriod('THIS_WEEK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedPeriod === 'THIS_WEEK' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              今週
            </button>
            <button
              onClick={() => setSelectedPeriod('THIS_MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedPeriod === 'THIS_MONTH' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              今月
            </button>
            <button
              onClick={() => setSelectedPeriod('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedPeriod === 'ALL' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
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
            const userAssignedTasks = tasks.filter((t) => t.assignedUserId === usr.id);
            const activeTasks = userAssignedTasks.filter((t) => t.progressState !== 'DONE');

            const totalPeriodHours = activeTasks.reduce((sum, task) => {
              return sum + calculateTaskHoursForPeriod(task, selectedPeriod);
            }, 0);

            // カレンダー実働営業日数に基づく上限設定
            const userMaxHours = usr.maxHours || 40;
            let maxCapacity = userMaxHours;
            if (selectedPeriod === 'THIS_MONTH') {
              maxCapacity = Math.round(userMaxHours * (actualBusinessDaysInMonth / 5));
            }
            if (selectedPeriod === 'ALL') {
              maxCapacity = userMaxHours * TOTAL_DISPLAY_WEEKS;
            }

            const loadRate = Math.min(100, Math.round((totalPeriodHours / maxCapacity) * 100));
            const isTotalOverloaded = totalPeriodHours > maxCapacity;

            // 1日8時間超過日のカウント
            const overloadedDaysCount = calculateDailyOverloadDays(userAssignedTasks, selectedPeriod);

            const roleStr = usr.roleName || (typeof usr.role === 'string' ? usr.role : usr.role?.name);

            return (
              <div
                key={usr.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                  isTotalOverloaded || overloadedDaysCount > 0 ? 'border-rose-300 ring-1 ring-rose-500/20' : 'border-slate-200'
                }`}
              >
                {/* メンバーカードヘッダー */}
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                      {getUserInitials(usr)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-base">{usr.name}</h4>
                        <span className="px-2 py-0.5 text-[10px] font-bold text-slate-500 bg-slate-100 rounded border border-slate-200">
                          {getRoleLabel(roleStr)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        アサイン済み: {userAssignedTasks.length}件 (未完了: {activeTasks.length}件)
                      </p>
                    </div>
                  </div>

                  {/* 負荷状況メーター */}
                  <div className="w-full md:w-80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500">
                        {selectedPeriod === 'THIS_WEEK'
                          ? '今週の予定負荷'
                          : selectedPeriod === 'THIS_MONTH'
                          ? `今月の予定負荷 (${actualBusinessDaysInMonth}営業日)`
                          : '全期間の予定負荷'}
                      </span>
                      <div className="flex items-center gap-1 font-bold">
                        <span className={isTotalOverloaded ? 'text-rose-600 font-extrabold' : 'text-slate-800'}>
                          {totalPeriodHours}h
                        </span>
                        <span className="text-slate-400 font-normal">/ {maxCapacity}h</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isTotalOverloaded || overloadedDaysCount > 0 ? 'bg-rose-500 animate-pulse' : loadRate > 85 ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${loadRate}%` }}
                      ></div>
                    </div>

                    {/* 精緻過負荷アラート (US-EM-02) */}
                    {overloadedDaysCount > 0 && (
                      <p className="text-[11px] font-bold text-rose-600 flex items-center justify-end gap-1">
                        ⚠️ 1日8h超過日が <span className="underline font-extrabold">{overloadedDaysCount}日</span> 存在します
                      </p>
                    )}
                    {isTotalOverloaded && overloadedDaysCount === 0 && (
                      <p className="text-[11px] font-bold text-rose-500 flex items-center justify-end gap-1">
                        ⚠️ 期間合計超過 ({Math.round(totalPeriodHours - maxCapacity)}h 超過)
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
                        const project = projects.find((p) => p.id === t.projectId);
                        const periodHours = calculateTaskHoursForPeriod(t, selectedPeriod);

                        return (
                          <div
                            key={t.id}
                            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition flex flex-col justify-between space-y-3 shadow-2xs"
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

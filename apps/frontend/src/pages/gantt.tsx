import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi, projectApi, userApi, taskDependencyApi } from '../api/task-api';
import { useAuthStore } from '../store/auth-store';
import type { Task, TaskProgressState, User, TaskDependency } from '../types/task';

// モックプロジェクトデータ（プロジェクト名紐付け用）
const mockProjects = [
  { id: '00000000-0000-0000-0000-000000000201', name: '認証基盤システム' },
  { id: '00000000-0000-0000-0000-000000000202', name: 'DevTaskApp' },
  { id: '00000000-0000-0000-0000-000000000203', name: '共通APIサービス' },
];

export default function Gantt() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [filterMyTasks, setFilterMyTasks] = useState<boolean>(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [editEndDate, setEditEndDate] = useState<string>('');

  // 依存関係管理モーダル用ステート
  const [depModalTask, setDepModalTask] = useState<Task | null>(null);
  const [selectedDependsOnTaskId, setSelectedDependsOnTaskId] = useState<string>('');

  // スクロール先のフラッシュ点滅ハイライト用ステート
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // バッジホバー時の連動ハイライトタスクID群
  const [hoveredLinkedTaskIds, setHoveredLinkedTaskIds] = useState<string[]>([]);

  // ポップオーバー表示中のタスクID・種類 ('predecessor' | 'successor')
  const [activePopover, setActivePopover] = useState<{ taskId: string; type: 'predecessor' | 'successor' } | null>(null);

  // バックエンドからデータ取得
  const { data: rawTasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: taskApi.list,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: userApi.list,
  });

  const { data: projects = mockProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectApi.list,
  });

  const { data: dependencies = [] } = useQuery<TaskDependency[]>({
    queryKey: ['taskDependencies'],
    queryFn: taskDependencyApi.list,
  });

  // スケジュール変更ミューテーション
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, plannedStartDate, plannedEndDate }: { taskId: string; plannedStartDate: string; plannedEndDate: string }) => {
      return taskApi.update(taskId, { plannedStartDate, plannedEndDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingTaskId(null);
    },
  });

  // 依存関係インライン編集用ステート
  const [editingDepId, setEditingDepId] = useState<string | null>(null);
  const [editingDependsOnTaskId, setEditingDependsOnTaskId] = useState<string>('');

  // 依存関係作成ミューテーション
  const createDepMutation = useMutation({
    mutationFn: async ({ dependentTaskId, dependsOnTaskId }: { dependentTaskId: string; dependsOnTaskId: string }) => {
      return taskDependencyApi.create(dependentTaskId, dependsOnTaskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskDependencies'] });
      setSelectedDependsOnTaskId('');
    },
  });

  // 依存関係更新（変更）ミューテーション
  const updateDepMutation = useMutation({
    mutationFn: async ({ id, dependsOnTaskId }: { id: string; dependsOnTaskId: string }) => {
      return taskDependencyApi.update(id, dependsOnTaskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskDependencies'] });
      setEditingDepId(null);
    },
  });

  // 依存関係削除ミューテーション
  const deleteDepMutation = useMutation({
    mutationFn: async (id: string) => {
      return taskDependencyApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskDependencies'] });
    },
  });

  // 自分の担当タスクのみの絞り込み処理
  const tasks = filterMyTasks
    ? rawTasks.filter((t) => t.assignedUserId === currentUser?.id)
    : rawTasks;

  // 該当タスク行への自動スムーズスクロール & フラッシュ点滅ハイライト関数
  const scrollToTask = (targetTaskId: string) => {
    const el = document.getElementById(`gantt-row-${targetTaskId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedTaskId(targetTaskId);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => {
        setHighlightedTaskId(null);
      }, 3000);
    }
  };

  // カレンダー表示範囲の設定（今日から前後15日、計30日間を表示）
  const totalDays = 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const daysArray: Date[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    daysArray.push(d);
  }

  const getZeroTimeDate = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  };

  const startDateTime = getZeroTimeDate(daysArray[0]);
  const endDateTime = getZeroTimeDate(daysArray[daysArray.length - 1]);

  const getStatusProgress = (state: TaskProgressState) => {
    switch (state) {
      case 'BACKLOG': return 0;
      case 'IN_PROGRESS': return 50;
      case 'IN_REVIEW': return 75;
      case 'DONE': return 100;
    }
  };

  const getStatusLabel = (state: TaskProgressState) => {
    switch (state) {
      case 'BACKLOG': return <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-slate-100 text-slate-500 rounded border border-slate-200">未着手</span>;
      case 'IN_PROGRESS': return <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-indigo-50 text-indigo-600 rounded border border-indigo-200">進行中</span>;
      case 'IN_REVIEW': return <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-amber-50 text-amber-600 rounded border border-amber-200">レビュー中</span>;
      case 'DONE': return <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-50 text-emerald-600 rounded border border-emerald-200">完了</span>;
    }
  };

  const getAssigneeName = (assignedUserId?: string) => {
    if (!assignedUserId) return '未割り当て';
    const foundUser = users.find((u: User) => u.id === assignedUserId);
    return foundUser ? foundUser.name : '担当者設定あり';
  };

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditStartDate(task.plannedStartDate ? task.plannedStartDate.slice(0, 10) : '');
    setEditEndDate(task.plannedEndDate ? task.plannedEndDate.slice(0, 10) : '');
  };

  const handleSaveSchedule = (taskId: string) => {
    if (!editStartDate || !editEndDate) return;
    updateTaskMutation.mutate({
      taskId,
      plannedStartDate: editStartDate,
      plannedEndDate: editEndDate,
    });
  };

  return (
    <div className="space-y-6">
      {/* ヘッダーパネル */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">スケジュール進捗 (ガントチャート)</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            先行・後続の依存関係 (`task_dependencies`) をビジュアルで把握し、クリックジャンプや依存登録が可能です。
          </p>
        </div>

        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setFilterMyTasks(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !filterMyTasks ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            👥 全体タスク
          </button>
          <button
            onClick={() => setFilterMyTasks(true)}
            data-testid="filter-my-gantt"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterMyTasks ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            👤 自分のタスクのみ
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-500 font-medium">ロード中...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[1250px] flex flex-col">
              {/* グリッドヘッダー */}
              <div className="flex border-b border-slate-200 bg-slate-50/50">
                <div className="w-[380px] shrink-0 p-4 font-bold text-xs text-slate-500 border-r border-slate-200">
                  タスク名 / 担当者 / 依存関係・期間
                </div>
                <div className="flex-1 grid grid-cols-[repeat(30,_minmax(0,_1fr))]">
                  {daysArray.map((day, idx) => {
                    const isToday = getZeroTimeDate(day) === getZeroTimeDate(new Date());
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    return (
                      <div
                        key={idx}
                        className={`h-16 flex flex-col items-center justify-center border-r border-slate-200/60 text-[10px] font-semibold relative ${
                          isToday ? 'bg-indigo-50 text-indigo-600 font-bold' : isWeekend ? 'bg-slate-100/50 text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {day.getDate() === 1 || idx === 0 ? (
                          <span className="absolute top-1 text-[9px] font-bold text-slate-400 uppercase">
                            {day.getMonth() + 1}月
                          </span>
                        ) : null}
                        <span className="mt-2">{day.getDate()}</span>
                        <span>
                          {['日', '月', '火', '水', '木', '金', '土'][day.getDay()]}
                        </span>
                        {isToday && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* グリッドボディ */}
              <div className="divide-y divide-slate-100">
                {tasks.map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  const progress = getStatusProgress(task.progressState);
                  const assigneeName = getAssigneeName(task.assignedUserId);

                  // 先行依存（Predecessors）: このタスクが依存している（前に終わるべき）タスク
                  const predDeps = dependencies.filter((d) => d.dependentTaskId === task.id);
                  const predTasks = predDeps
                    .map((d) => rawTasks.find((t) => t.id === d.dependsOnTaskId))
                    .filter((t): t is Task => t !== undefined);

                  // 後続依存（Successors）: このタスクに依存している（後に着手される）タスク
                  const succDeps = dependencies.filter((d) => d.dependsOnTaskId === task.id);
                  const succTasks = succDeps
                    .map((d) => rawTasks.find((t) => t.id === d.dependentTaskId))
                    .filter((t): t is Task => t !== undefined);

                  // 先行タスクのうち未完了のものが存在するかチェック
                  const hasUncompletedPredecessor = predTasks.some((t) => t.progressState !== 'DONE');

                  const isHighlighted = highlightedTaskId === task.id;
                  const isHoverLinked = hoveredLinkedTaskIds.includes(task.id);

                  let startCol = -1;
                  let colSpan = 0;
                  let hasSchedule = false;

                  if (task.plannedStartDate && task.plannedEndDate) {
                    const plannedStart = getZeroTimeDate(new Date(task.plannedStartDate));
                    const plannedEnd = getZeroTimeDate(new Date(task.plannedEndDate));

                    if (plannedEnd >= startDateTime && plannedStart <= endDateTime) {
                      hasSchedule = true;
                      const diffFromStart = Math.round((plannedStart - startDateTime) / (24 * 60 * 60 * 1000));
                      startCol = Math.max(0, diffFromStart) + 1;
                      const duration = Math.round((plannedEnd - Math.max(startDateTime, plannedStart)) / (24 * 60 * 60 * 1000)) + 1;
                      colSpan = Math.min(totalDays - (startCol - 1), duration);
                    }
                  }

                  return (
                    <div
                      key={task.id}
                      id={`gantt-row-${task.id}`}
                      className={`flex transition-all duration-300 items-stretch ${
                        isHighlighted
                          ? 'bg-amber-100/80 ring-2 ring-amber-400 z-10 animate-pulse'
                          : isHoverLinked
                          ? 'bg-indigo-50/70 border-l-4 border-indigo-500'
                          : 'hover:bg-slate-50/50'
                      }`}
                    >
                      {/* タスク情報列 */}
                      <div className="w-[360px] shrink-0 py-2 px-3 border-r border-slate-200 flex flex-col justify-center space-y-1 relative">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-bold text-slate-800 text-xs truncate">{task.title}</span>
                          {hasUncompletedPredecessor && (
                            <span className="px-1.5 py-0.5 text-[8px] font-extrabold bg-rose-100 text-rose-700 border border-rose-300 rounded-full shrink-0">
                              ⚠️ 先行未完了
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] leading-tight">
                          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200 truncate">
                            👤 {assigneeName}
                          </span>
                          <span className="font-medium text-slate-400 truncate">
                            {project?.name || 'タスク管理'}
                          </span>
                        </div>

                        {/* 先行・後続依存バッジ ＆ 吹き出しポップオーバー */}
                        <div className="flex items-center gap-1.5 relative flex-wrap">
                          {/* 先行タスクバッジ */}
                          {predTasks.length > 0 && (
                            <div
                              className="relative inline-block"
                              onMouseEnter={() => {
                                setActivePopover({ taskId: task.id, type: 'predecessor' });
                                setHoveredLinkedTaskIds(predTasks.map((t) => t.id));
                              }}
                              onMouseLeave={() => {
                                setActivePopover(null);
                                setHoveredLinkedTaskIds([]);
                              }}
                            >
                              <button className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100 transition flex items-center gap-0.5">
                                🔗 先行 {predTasks.length}件
                              </button>

                              {/* 吹き出しポップオーバー (Predecessors) */}
                              {activePopover?.taskId === task.id && activePopover?.type === 'predecessor' && (
                                <div
                                  className="absolute bottom-full left-0 mb-1 z-50 w-72 bg-slate-900 text-white rounded-xl p-3 text-xs shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="font-bold text-amber-300 mb-2 flex items-center justify-between border-b border-slate-800 pb-1.5">
                                    <span>🔗 先行タスク ({predTasks.length}件)</span>
                                    <span className="text-[9px] text-slate-400 font-normal">クリックで移動</span>
                                  </div>
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {predTasks.map((pt) => (
                                      <div
                                        key={pt.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          scrollToTask(pt.id);
                                        }}
                                        className="p-2 bg-slate-800 hover:bg-indigo-950 rounded-lg border border-slate-700/60 cursor-pointer transition flex items-start justify-between gap-2 group"
                                      >
                                        <div>
                                          <div className="font-semibold text-slate-100 group-hover:text-indigo-300 transition">
                                            {pt.title}
                                          </div>
                                          <div className="text-[10px] text-slate-400 mt-0.5">
                                            予定: {pt.plannedStartDate?.slice(5, 10) || '未定'} 〜 {pt.plannedEndDate?.slice(5, 10) || '未定'}
                                          </div>
                                        </div>
                                        <div className="shrink-0">
                                          {getStatusLabel(pt.progressState)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  {/* 吹き出しの三角形矢印 */}
                                  <div className="absolute top-full left-4 -mt-0.5 border-6 border-transparent border-t-slate-900"></div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 後続タスクバッジ */}
                          {succTasks.length > 0 && (
                            <div
                              className="relative inline-block"
                              onMouseEnter={() => {
                                setActivePopover({ taskId: task.id, type: 'successor' });
                                setHoveredLinkedTaskIds(succTasks.map((t) => t.id));
                              }}
                              onMouseLeave={() => {
                                setActivePopover(null);
                                setHoveredLinkedTaskIds([]);
                              }}
                            >
                              <button className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded hover:bg-indigo-100 transition flex items-center gap-0.5">
                                🔜 後続 {succTasks.length}件
                              </button>

                              {/* 吹き出しポップオーバー (Successors) */}
                              {activePopover?.taskId === task.id && activePopover?.type === 'successor' && (
                                <div
                                  className="absolute bottom-full left-0 mb-1 z-50 w-72 bg-slate-900 text-white rounded-xl p-3 text-xs shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="font-bold text-indigo-300 mb-2 flex items-center justify-between border-b border-slate-800 pb-1.5">
                                    <span>🔜 後続タスク ({succTasks.length}件)</span>
                                    <span className="text-[9px] text-slate-400 font-normal">クリックで移動</span>
                                  </div>
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {succTasks.map((st) => (
                                      <div
                                        key={st.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          scrollToTask(st.id);
                                        }}
                                        className="p-2 bg-slate-800 hover:bg-indigo-950 rounded-lg border border-slate-700/60 cursor-pointer transition flex items-start justify-between gap-2 group"
                                      >
                                        <div>
                                          <div className="font-semibold text-slate-100 group-hover:text-indigo-300 transition">
                                            {st.title}
                                          </div>
                                          <div className="text-[10px] text-slate-400 mt-0.5">
                                            予定: {st.plannedStartDate?.slice(5, 10) || '未定'} 〜 {st.plannedEndDate?.slice(5, 10) || '未定'}
                                          </div>
                                        </div>
                                        <div className="shrink-0">
                                          {getStatusLabel(st.progressState)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  {/* 吹き出しの三角形矢印 */}
                                  <div className="absolute top-full left-4 -mt-0.5 border-6 border-transparent border-t-slate-900"></div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* スケジュールクイック調整フォーム */}
                        {editingTaskId === task.id ? (
                          <div className="flex items-center gap-1 pt-0.5">
                            <input
                              type="date"
                              value={editStartDate}
                              onChange={(e) => setEditStartDate(e.target.value)}
                              className="px-1 py-0.5 text-[9px] border border-slate-300 rounded"
                            />
                            <span className="text-slate-400 text-[9px]">〜</span>
                            <input
                              type="date"
                              value={editEndDate}
                              onChange={(e) => setEditEndDate(e.target.value)}
                              className="px-1 py-0.5 text-[9px] border border-slate-300 rounded"
                            />
                            <button
                              onClick={() => handleSaveSchedule(task.id)}
                              disabled={updateTaskMutation.isPending}
                              className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-600 text-white rounded hover:bg-indigo-700"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => setEditingTaskId(null)}
                              className="px-1 py-0.5 text-[9px] text-slate-500 border border-slate-200 rounded"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                            <span>
                              予定: {task.plannedStartDate ? task.plannedStartDate.slice(5, 10) : '未定'} 〜 {task.plannedEndDate ? task.plannedEndDate.slice(5, 10) : '未定'}
                            </span>
                            <button
                              onClick={() => handleStartEdit(task)}
                              className="text-indigo-600 font-bold hover:underline"
                            >
                              ✏️ 日程調整
                            </button>
                          </div>
                        )}
                      </div>

                      {/* タイムライングリッド */}
                      <div className="flex-1 grid grid-cols-[repeat(30,_minmax(0,_1fr))] items-center relative min-h-[46px]">
                        {Array.from({ length: totalDays }).map((_, idx) => (
                          <div
                            key={idx}
                            className="absolute top-0 bottom-0 border-r border-slate-100"
                            style={{ gridColumnStart: idx + 1 }}
                          ></div>
                        ))}

                        {/* ガントチャートバー */}
                        {hasSchedule ? (
                          <div
                            className={`relative h-6 rounded-md shadow-2xs border flex overflow-hidden select-none group transition-all ${
                              predTasks.length > 0 ? 'ring-1 ring-amber-400/50 border-amber-300' : 'border-indigo-100'
                            }`}
                            style={{
                              gridColumnStart: startCol,
                              gridColumnEnd: startCol + colSpan,
                            }}
                            title={`${task.title}\n担当者: ${assigneeName}\n予定期間: ${task.plannedStartDate?.slice(0, 10)} 〜 ${task.plannedEndDate?.slice(0, 10)}\n進捗: ${progress}%`}
                          >
                            <div className="absolute inset-y-0 left-0 bg-indigo-500/20" style={{ width: '100%' }}></div>
                            <div className="absolute inset-y-0 left-0 bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>

                            <div className="absolute inset-0 flex items-center justify-between px-2 text-[9px] font-bold text-white z-10 drop-shadow-xs">
                              <span className="truncate">{task.title} ({assigneeName})</span>
                              <span>{progress}%</span>
                            </div>
                          </div>
                        ) : (
                          <div className="col-span-30 py-2 text-center text-[10px] text-slate-400 italic">
                            予定期間が未設定です
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {tasks.length === 0 && (
                  <div className="p-12 text-center text-slate-400 font-medium">
                    タスクが登録されていないか、絞り込み条件に一致するタスクがありません。
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

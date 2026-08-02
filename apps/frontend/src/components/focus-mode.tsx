import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi, workLogApi } from '../api/task-api';
import { useAuthStore } from '../store/auth-store';
import type { Task, TaskProgressState } from '../types/task';

export default function FocusMode() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // タイマー状態
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [logDescription, setLogDescription] = useState<string>('');

  // バックエンドからタスク一覧を取得
  const { data: allTasks, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: taskApi.list,
  });

  // 自分にアサインされている未完了タスクのみを厳密抽出
  const myTasks = allTasks?.filter(
    (t) => t.assignedUserId === user?.id && t.progressState !== 'DONE'
  ) || [];

  // タイマーのインターバル処理
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // 工数記録APIを呼ぶミューテーション
  const createWorkLogMutation = useMutation({
    mutationFn: async ({ taskId, hours, description }: { taskId: string; hours: number; description?: string }) => {
      if (!user?.id) throw new Error('ユーザー情報が見つかりません');
      const today = new Date().toISOString().split('T')[0];
      return workLogApi.create(taskId, user.id, today, hours, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['workLogs'] });
      setSecondsElapsed(0);
      setIsTimerRunning(false);
      setActiveTaskId(null);
      setLogDescription('');
    },
  });

  // タスク状態更新ミューテーション
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, progressState }: { taskId: string; progressState: TaskProgressState }) => {
      return taskApi.update(taskId, { progressState });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleStartTimer = (taskId: string) => {
    if (activeTaskId && activeTaskId !== taskId) {
      if (!confirm('すでに他のタスクのタイマーが動作中です。切替えますか？')) return;
    }
    setActiveTaskId(taskId);
    setIsTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleStopAndSave = (taskId: string) => {
    setIsTimerRunning(false);
    const hours = Math.max(0.1, Number((secondsElapsed / 3600).toFixed(2)));
    createWorkLogMutation.mutate({
      taskId,
      hours,
      description: logDescription || 'フォーカスモードでの作業実績',
    });
  };

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* フォーカスモード専用ヘッダー (内部IDなどの不要な文言を排除) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                フォーカスモード
              </span>
              <span className="text-xs text-slate-400 font-medium">マイ・タスク ＆ タイムトラッキング</span>
            </div>
            <h2 className="text-2xl font-black mt-2 tracking-wide bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              今日のフォーカス・タスク
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              雑音を排除し、今日の作業だけに集中。ワンクリックで実績工数を記録します。
            </p>
          </div>

          {/* アクティブタイマー表示カード */}
          {activeTaskId && (
            <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-4 flex items-center gap-6 shadow-inner">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">計測中の時間</span>
                <span className="text-3xl font-mono font-extrabold text-indigo-400 animate-pulse">
                  {formatTimer(secondsElapsed)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isTimerRunning ? (
                  <button
                    onClick={handlePauseTimer}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition"
                  >
                    一時停止
                  </button>
                ) : (
                  <button
                    onClick={() => setIsTimerRunning(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-500 text-white hover:bg-indigo-600 transition"
                  >
                    再開
                  </button>
                )}
                <button
                  onClick={() => handleStopAndSave(activeTaskId)}
                  disabled={createWorkLogMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20"
                >
                  {createWorkLogMutation.isPending ? '保存中...' : '実績を記録して完了'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* マイタスク一覧 */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs font-semibold">タスクを読み込み中...</div>
      ) : myTasks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 mx-auto flex items-center justify-center font-bold text-xl">
            🎉
          </div>
          <h3 className="font-bold text-slate-800 text-base">本日対応すべきタスクはありません</h3>
          <p className="text-xs text-slate-400">新しいタスクが割当られるか、全タスクが完了しています。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myTasks.map((task, index) => {
            const isActive = activeTaskId === task.id;
            return (
              <div
                key={task.id}
                data-testid={`focus-task-card-${task.id}`}
                className={`bg-white rounded-3xl p-6 border transition-all duration-200 shadow-xs space-y-4 ${
                  isActive ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-indigo-500/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      TASK-{index + 1}
                    </span>
                    <h4 className="font-bold text-slate-800 text-base mt-1.5 leading-snug">{task.title}</h4>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full shrink-0 ${
                      task.progressState === 'IN_PROGRESS'
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                        : task.progressState === 'IN_REVIEW'
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {task.progressState === 'IN_PROGRESS' ? '進行中' : task.progressState === 'IN_REVIEW' ? 'レビュー中' : '未着手'}
                  </span>
                </div>

                {/* タイマー計測と実績追加フォーム */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">⏱ タイムトラッキング</span>
                    {isActive ? (
                      <span className="text-xs font-mono font-bold text-indigo-600">{formatTimer(secondsElapsed)}</span>
                    ) : (
                      <span className="text-xs text-slate-400">停止中</span>
                    )}
                  </div>

                  {isActive && (
                    <input
                      type="text"
                      placeholder="作業メモを入力（任意）..."
                      value={logDescription}
                      onChange={(e) => setLogDescription(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    {isActive ? (
                      <button
                        onClick={() => handleStopAndSave(task.id)}
                        disabled={createWorkLogMutation.isPending}
                        data-testid={`stop-timer-btn-${task.id}`}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition shadow-md shadow-emerald-600/10"
                      >
                        {createWorkLogMutation.isPending ? '保存中...' : '⏱ タイマー停止 ＆ 実績保存'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartTimer(task.id)}
                        data-testid={`start-timer-btn-${task.id}`}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 active:scale-98 transition shadow-md shadow-indigo-500/10"
                      >
                        ▶️ タイマー開始
                      </button>
                    )}
                  </div>
                </div>

                {/* クイックステータス変更 */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-400">ステータス変更:</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => updateStatusMutation.mutate({ taskId: task.id, progressState: 'IN_PROGRESS' })}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold transition"
                    >
                      進行中へ
                    </button>
                    <button
                      onClick={() => updateStatusMutation.mutate({ taskId: task.id, progressState: 'IN_REVIEW' })}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold transition"
                    >
                      レビューへ
                    </button>
                    <button
                      onClick={() => updateStatusMutation.mutate({ taskId: task.id, progressState: 'DONE' })}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold transition"
                    >
                      完了にする
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

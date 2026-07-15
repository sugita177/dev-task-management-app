import { useQuery } from '@tanstack/react-query';
import { taskApi } from '../api/task-api';
import type { Task, TaskProgressState } from '../types/task';

// モックプロジェクトデータ（プロジェクト名紐付け用）
const mockProjects = [
  { id: '00000000-0000-0000-0000-000000000201', name: '認証基盤システム' },
  { id: '00000000-0000-0000-0000-000000000202', name: 'DevTaskApp' },
  { id: '00000000-0000-0000-0000-000000000203', name: '共通APIサービス' },
];

export default function Gantt() {
  // バックエンドからタスク一覧を取得
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: taskApi.list,
  });

  // カレンダー表示範囲の設定（今日から前後15日、計30日間を表示）
  const totalDays = 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7); // 今日から7日前を開始日とする

  // 30日分の日付配列を作成
  const daysArray: Date[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    daysArray.push(d);
  }

  // 日付の正規化 (比較用)
  const getZeroTimeDate = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  };

  const startDateTime = getZeroTimeDate(daysArray[0]);
  const endDateTime = getZeroTimeDate(daysArray[daysArray.length - 1]);

  const getStatusProgress = (state: TaskProgressState) => {
    switch (state) {
      case 'BACKLOG': return 0;
      case 'IN_PROGRESS': return 40;
      case 'IN_REVIEW': return 80;
      case 'DONE': return 100;
    }
  };


  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-lg font-bold text-slate-800 mb-2">スケジュール進捗 (ガントチャート)</h3>
        <p className="text-xs text-slate-500">プロジェクト全体のスケジュール進捗とタイムラインを一覧で可視化します。</p>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-500 font-medium">ロード中...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* 横スクロール対応コンテナ */}
          <div className="overflow-x-auto">
            <div className="min-w-[1200px] flex flex-col">
              {/* グリッドヘッダー */}
              <div className="flex border-b border-slate-200 bg-slate-50/50">
                {/* タスク情報列 (固定枠) */}
                <div className="w-[300px] shrink-0 p-4 font-bold text-xs text-slate-500 border-r border-slate-200">
                  タスク名 / プロジェクト
                </div>
                {/* カレンダータイムライン列 */}
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
                  const project = mockProjects.find(p => p.id === task.projectId);
                  const progress = getStatusProgress(task.progressState);

                  // ガントバーのグリッド位置計算
                  let startCol = -1;
                  let colSpan = 0;
                  let hasSchedule = false;

                  if (task.plannedStartDate && task.plannedEndDate) {
                    const plannedStart = getZeroTimeDate(new Date(task.plannedStartDate));
                    const plannedEnd = getZeroTimeDate(new Date(task.plannedEndDate));

                    // カレンダーの範囲内に入っているか検証
                    if (plannedEnd >= startDateTime && plannedStart <= endDateTime) {
                      hasSchedule = true;

                      // 開始位置の計算
                      const diffFromStart = Math.round((plannedStart - startDateTime) / (24 * 60 * 60 * 1000));
                      startCol = Math.max(0, diffFromStart) + 1; // CSS Gridの始点は1から始まる

                      // 期間（グリッド幅）の計算
                      const duration = Math.round((plannedEnd - Math.max(startDateTime, plannedStart)) / (24 * 60 * 60 * 1000)) + 1;
                      colSpan = Math.min(totalDays - (startCol - 1), duration);
                    }
                  }

                  return (
                    <div key={task.id} className="flex hover:bg-slate-50/50 transition items-stretch">
                      {/* タスク情報列 */}
                      <div className="w-[300px] shrink-0 p-4 border-r border-slate-200 flex flex-col justify-center">
                        <span className="font-bold text-slate-800 text-sm truncate">{task.title}</span>
                        <span className="text-[10px] font-semibold text-slate-400 mt-1">
                          {project?.name || 'タスク管理アプリ'}
                        </span>
                      </div>

                      {/* タイムライングリッド */}
                      <div className="flex-1 grid grid-cols-[repeat(30,_minmax(0,_1fr))] items-center relative min-h-[56px]">
                        {/* グリッド背景の縦線 */}
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
                            className="relative h-7 rounded-lg shadow-sm border border-indigo-100 flex overflow-hidden select-none group"
                            style={{
                              gridColumnStart: startCol,
                              gridColumnEnd: startCol + colSpan,
                            }}
                            title={`${task.title}\n予定期間: ${task.plannedStartDate?.slice(0, 10)} 〜 ${task.plannedEndDate?.slice(0, 10)}\n進捗: ${progress}%`}
                          >
                            {/* 進捗バー表示用の背景色 */}
                            <div className="absolute inset-y-0 left-0 bg-indigo-500/20" style={{ width: '100%' }}></div>
                            <div className="absolute inset-y-0 left-0 bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>

                            {/* ラベル表示 */}
                            <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-bold text-white z-10 drop-shadow-md">
                              <span className="truncate">{task.title}</span>
                              <span>{progress}%</span>
                            </div>
                          </div>
                        ) : (
                          <div className="col-span-30 py-3 text-center text-xs text-slate-400 italic">
                            予定期間が未設定です
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {tasks.length === 0 && (
                  <div className="p-12 text-center text-slate-400 font-medium">
                    タスクが登録されていません。かんばんボードからタスクを追加してください。
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

import { test, expect } from '@playwright/test';

test.describe('ENGINEER ロール ユーザーストーリー E2Eテスト', () => {

  test('US-ENG-01: マイ・フォーカスモードでの実績入力とタイマー動作', async ({ page }) => {
    // 1. ダッシュボードへアクセス
    await page.goto('/');

    // 2. フォーカスモードタブが選択されていることの確認
    const focusTab = page.getByTestId('tab-focus-mode');
    await expect(focusTab).toBeVisible();

    // 3. ヘッダータイトルが表示されていること
    const focusHeading = page.getByText(/今日のフォーカス・タスク/i);
    await expect(focusHeading).toBeVisible();

    // 4. タイマー開始ボタンが存在する場合、タイマー開始動作のテスト
    const startTimerBtn = page.getByRole('button', { name: /▶️ タイマー開始/i }).first();
    if (await startTimerBtn.isVisible()) {
      await startTimerBtn.click();

      // 計測中状態（一時停止 または タイマー停止 ボタン）への変化を確認
      const stopTimerBtn = page.getByRole('button', { name: /タイマー停止/i }).first();
      await expect(stopTimerBtn).toBeVisible();
    }
  });

  test('US-ENG-02: マイ・ガントチャートとセルフキャパシティ分析の確認', async ({ page }) => {
    // 1. ガントチャートページへアクセス
    await page.goto('/gantt');

    // 2. ガントチャートタイトルが正常描画されていること
    const ganttHeading = page.getByRole('heading', { name: 'ガントチャート', exact: true });
    await expect(ganttHeading).toBeVisible();

    // 3. 自分のタスクのみ絞り込みボタンのクリックテスト
    const myGanttFilterBtn = page.getByTestId('filter-my-gantt');
    await expect(myGanttFilterBtn).toBeVisible();
    await myGanttFilterBtn.click();

    // 4. アサイン状況画面での自分の負荷のみ絞り込み確認
    await page.goto('/assignments');
    const myAssignmentFilterBtn = page.getByRole('button', { name: /自分の負荷のみ/i });
    await expect(myAssignmentFilterBtn).toBeVisible();
    await myAssignmentFilterBtn.click();
  });

  test('かんばんボードでの「自分のタスクのみ」絞り込みフィルターテスト', async ({ page }) => {
    // 1. かんばん（タスク一覧）へ移動
    await page.goto('/tasks');

    // 2. 自分のタスクのみフィルターボタンの動作確認
    const myKanbanFilterBtn = page.getByTestId('filter-my-kanban');
    await expect(myKanbanFilterBtn).toBeVisible();
    await myKanbanFilterBtn.click();
  });

});

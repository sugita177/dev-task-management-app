import { test, expect } from '@playwright/test';

test.describe('ENGINEERING_MANAGER (EM) ロール ユーザーストーリー E2Eテスト', () => {

  test.beforeEach(async ({ page }) => {
    // storageStateにより自動認証済み
    await page.goto('/tasks');
  });

  test('US-EM-01: ガントチャートのインタラクティブ表示と日程調整・依存関係確認', async ({ page }) => {
    await page.goto('/gantt');
    await expect(page.getByText(/ガントチャート/i).first()).toBeVisible({ timeout: 15000 });

    // スケジュール調整ボタンが表示されていることを確認
    const editScheduleBtn = page.getByRole('button', { name: /✏️ 日程調整/i }).first();
    await expect(editScheduleBtn).toBeVisible({ timeout: 15000 });

    // 「先行」の依存関係バッジの表示確認
    const depBadge = page.getByText(/🔗 先行|先行/i).first();
    await expect(depBadge).toBeVisible({ timeout: 15000 });
  });

  test('US-EM-02: 期間別の精緻なキャパシティ（アサイン負荷・カレンダー営業日）分析とフィルター切替', async ({ page }) => {
    await page.goto('/assignments');
    await expect(page.getByText(/メンバーアサイン状況/i).first()).toBeVisible({ timeout: 15000 });

    // 今月フィルターへの切り替え
    const monthBtn = page.getByRole('button', { name: /^今月$/ });
    await expect(monthBtn).toBeVisible({ timeout: 15000 });
    await monthBtn.click();
    await expect(page.getByText(/今月の予定負荷/).first()).toBeVisible({ timeout: 15000 });

    // 自分の負荷のみフィルターへの切り替え
    const myAssignmentsBtn = page.getByRole('button', { name: /自分の負荷のみ/i });
    await expect(myAssignmentsBtn).toBeVisible({ timeout: 15000 });
    await myAssignmentsBtn.click();
  });

  test('US-EM-03: 見積もりと実績の偏差およびキャパシティ確認', async ({ page }) => {
    await page.goto('/assignments');
    await expect(page.getByText(/メンバーアサイン状況/i).first()).toBeVisible({ timeout: 15000 });

    // トータル負荷表示またはタスクカードが存在することを確認
    const assignmentTitle = page.getByText(/アサイン済み:/i).first();
    await expect(assignmentTitle).toBeVisible({ timeout: 15000 });
  });

});

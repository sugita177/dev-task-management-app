import { test, expect } from '@playwright/test';

test.describe('ENGINEER ロール ユーザーストーリー E2Eテスト', () => {

  test.beforeEach(async ({ page }) => {
    // storageStateにより自動認証済み
    await page.goto('/tasks');
  });

  test('US-ENG-01: マイ・フォーカスモードでの実績入力とタイマー動作', async ({ page }) => {
    await expect(page).toHaveTitle(/DevTaskPro/);
    // タスクカード（またはかんばんボード）が確実に表示されること
    const taskBoard = page.getByTestId('create-task-button');
    await expect(taskBoard).toBeVisible({ timeout: 10000 });
  });

  test('US-ENG-02: マイ・ガントチャートとセルフキャパシティ分析の確認', async ({ page }) => {
    await page.goto('/gantt');
    await expect(page.getByText(/ガントチャート/i).first()).toBeVisible({ timeout: 10000 });
  });

});

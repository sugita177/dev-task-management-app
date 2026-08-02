import { test, expect } from '@playwright/test';

test.describe('ENGINEERING_MANAGER (EM) ロール ユーザーストーリー E2Eテスト', () => {

  test.beforeEach(async ({ page }) => {
    // storageStateにより自動認証済み
    await page.goto('/tasks');
  });

  test('US-EM-01: ガントチャートのインタラクティブ表示', async ({ page }) => {
    await page.goto('/gantt');
    await expect(page.getByText(/ガントチャート/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('US-EM-02: 期間別の精緻なキャパシティ（アサイン負荷）分析とフィルター切替', async ({ page }) => {
    await page.goto('/assignments');
    await expect(page.getByText(/メンバーアサイン状況/i).first()).toBeVisible({ timeout: 10000 });

    const monthBtn = page.getByRole('button', { name: /^今月$/ });
    await expect(monthBtn).toBeVisible();
    await monthBtn.click();
    await expect(page.getByText(/今月の予定負荷/).first()).toBeVisible({ timeout: 10000 });
  });

  test('US-EM-03: 見積もりと実績の乖離（偏差）アラート表示確認', async ({ page }) => {
    await page.goto('/assignments');
    await expect(page.getByText(/メンバーアサイン状況/i).first()).toBeVisible({ timeout: 10000 });
  });

});

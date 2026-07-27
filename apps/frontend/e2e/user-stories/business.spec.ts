import { test, expect } from '@playwright/test';

test.describe('BUSINESS ロール ユーザーストーリー E2Eテスト', () => {

  test.beforeEach(async ({ page }) => {
    // storageStateにより自動認証済み
    await page.goto('/tasks');
  });

  test('US-BUS-01: ロードマップ・ビジネス進捗ビューの確認', async ({ page }) => {
    await page.goto('/gantt');
    await expect(page.getByText(/ガントチャート/i).first()).toBeVisible({ timeout: 10000 });
  });

});

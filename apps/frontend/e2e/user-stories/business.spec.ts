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

  test('自分が起票・リクエストしたタスクのフィルタリング動作確認', async ({ page }) => {
    await page.goto('/tasks');
    const createdFilterBtn = page.getByTestId('filter-created-kanban');
    await expect(createdFilterBtn).toBeVisible({ timeout: 15000 });
    await createdFilterBtn.click();

    // 選択状態（アクティブ化）のアサーション
    await expect(createdFilterBtn).toHaveClass(/bg-white/);
  });

});

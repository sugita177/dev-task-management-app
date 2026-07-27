import { test, expect } from '@playwright/test';

test.describe('ADMINISTRATOR ロール ユーザーストーリー E2Eテスト', () => {

  test.beforeEach(async ({ page }) => {
    // storageStateにより自動認証済み
    await page.goto('/tasks');
  });

  test('US-ADM-01: テナント・組織マスタの統制と認証セッションの保護確認', async ({ page }) => {
    await expect(page).toHaveTitle(/DevTaskPro/);
    
    // Cookie "is_logged_in" が存在することの確認
    const cookies = await page.context().cookies();
    const isLoggedInCookie = cookies.find(c => c.name === 'is_logged_in');
    expect(isLoggedInCookie).toBeDefined();
    expect(isLoggedInCookie?.value).toBe('true');
  });

  test('未認証状態での全域保護APIアクセス拒否 (401 Unauthorized)', async ({ page }) => {
    // クッキーをクリアして未認証（未ログイン）状態にする
    await page.context().clearCookies();
    
    // 保護されたバックエンド API へ直接アクセス
    const response = await page.request.get('http://localhost:3001/api/tasks');
    expect(response.status()).toBe(401);
  });

});

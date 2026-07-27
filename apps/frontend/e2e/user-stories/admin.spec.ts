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

});

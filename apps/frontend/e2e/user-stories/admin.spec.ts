import { test, expect } from '@playwright/test';

test.describe('ADMINISTRATOR ロール ユーザーストーリー E2Eテスト', () => {

  test('US-ADM-01: テナント・組織マスタの統制と認証セッションの保護確認', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page).toHaveTitle(/DevTaskPro/);
    
    // Cookie "is_logged_in" が存在することの確認
    const cookies = await page.context().cookies();
    const isLoggedInCookie = cookies.find(c => c.name === 'is_logged_in');
    expect(isLoggedInCookie).toBeDefined();
    expect(isLoggedInCookie?.value).toBe('true');

    // ヘッダーに動的組織名（開発第一チーム）が表示されていることの確認
    const orgNameBadge = page.getByText(/開発第一チーム/i);
    await expect(orgNameBadge).toBeVisible();
  });

  test('未認証状態での全域保護APIアクセス拒否 (401 Unauthorized)', async ({ page }) => {
    // クッキーをクリアして未認証（未ログイン）状態にする
    await page.context().clearCookies();
    
    // 保護されたバックエンド API へ直接アクセス
    const response = await page.request.get('http://localhost:3001/api/tasks');
    expect(response.status()).toBe(401);
  });

  test('Axios 401 インターセプターによる自動トークンリフレッシュおよびシームレスリトライの検証', async ({ page }) => {
    let callCount = 0;
    // ページ遷移前に /api/tasks へのモックルートを設定
    await page.route('**/api/tasks', async (route) => {
      callCount++;
      if (callCount === 1) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Unauthorized (Token Expired Mock)' }),
        });
      } else {
        await route.continue();
      }
    });

    // 2回目の自動リトライ通信 (200 OK) の完了を同期待機するプロミスを作成
    const retryPromise = page.waitForResponse(
      (res) => res.url().includes('/api/tasks') && res.status() === 200,
    );

    // /tasks へアクセス（最初の API 呼び出しで 401 が発生 ➔ インターセプターが /api/auth/refresh を呼んで自動リトライ）
    await page.goto('/tasks');

    // リトライ通信が 200 OK で完了するまで同期待機
    await retryPromise;

    // インターセプターのリトライ成功により、無事にタスク一覧ヘッダーが表示されること
    const heading = page.getByRole('heading', { name: /タスク一覧/i });
    await expect(heading).toBeVisible();

    // 最初の 401 + 自動リトライ成功で計 2 回 /api/tasks が呼び出されたことを確認
    expect(callCount).toBe(2);
  });

});

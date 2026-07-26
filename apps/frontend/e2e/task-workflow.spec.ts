import { test, expect } from '@playwright/test';

test.describe('DevTaskPro E2E Workflows', () => {

  test.beforeEach(async ({ page }) => {
    // 1. ログイン画面へアクセス
    await page.goto('/login');

    // 2. Satoshi Manager のデモログインボタンをクリックしてログイン
    const demoBtn = page.getByRole('button', { name: /Satoshi Manager/i });
    if (await demoBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await demoBtn.click();
      await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
    }
  });

  test('新規タスクを作成し、詳細モーダルで起票履歴ログが確認できること (getByTestId使用)', async ({ page }) => {
    // 1. かんばん（タスク一覧）画面へ移動
    await page.goto('/tasks');
    await expect(page).toHaveTitle(/DevTaskPro/);

    // 2. 「タスクを追加」ボタンをクリック (data-testid を使用)
    const createBtn = page.getByTestId('create-task-button');
    await expect(createBtn).toBeVisible({ timeout: 15000 });
    await createBtn.click();

    // 3. モーダルのフォームに入力 (data-testid を使用)
    const uniqueTitle = `Playwright Auto Task ${Date.now()}`;
    await page.getByTestId('task-title-input').fill(uniqueTitle);
    await page.getByTestId('task-desc-input').fill('Playwrightによる自動E2Eテストで作成されたタスクです。');

    // 保存ボタンをクリック
    const saveBtn = page.getByTestId('submit-create-task-button');
    await saveBtn.click();

    // 4. 新規タスクカードが一覧に表示されること
    const newCard = page.getByText(uniqueTitle);
    await expect(newCard).toBeVisible({ timeout: 5000 });

    // 5. タスクカードをクリックして詳細モーダルを開く
    await newCard.click();

    // 6. 「変更履歴」タブをクリック
    const historyTab = page.getByRole('button', { name: /変更履歴/i });
    await historyTab.click();

    // 7. 「タスクを起票しました。」がログに含まれていること
    const creationLog = page.getByText(/タスクを起票しました。/i);
    await expect(creationLog).toBeVisible();
  });

  test('未割り当てタスクにメンバー（田中 太郎）を割り当て（更新）、アサイン状況画面に反映されること', async ({ page }) => {
    // 1. かんばん画面へ移動
    await page.goto('/tasks');

    // 2. 新規未割り当てタスクを作成
    await page.getByTestId('create-task-button').click();
    const taskTitle = `Unassigned Task ${Date.now()}`;
    await page.getByTestId('task-title-input').fill(taskTitle);
    await page.getByTestId('submit-create-task-button').click();

    // 3. 作成したタスクカードを開いて詳細編集
    const card = page.getByText(taskTitle);
    await expect(card).toBeVisible({ timeout: 5000 });
    await card.click();

    // 4. 詳細モーダルで担当者セレクトボックスから「田中 太郎」を選択して更新保存
    const editAssigneeSelect = page.getByTestId('edit-assignee-select');
    await editAssigneeSelect.selectOption({ label: '田中 太郎' });
    await page.getByTestId('submit-edit-task-button').click();

    // 5. アサイン状況画面へ移動し、田中 太郎の枠内にアサインされたことを確認
    await page.goto('/assignments');
    await expect(page.getByText(/メンバーアサイン状況/i).first()).toBeVisible({ timeout: 10000 });

    const assignedTaskText = page.getByText(taskTitle);
    await expect(assignedTaskText).toBeVisible({ timeout: 5000 });
  });

  test('アサイン状況画面で「今週」「今月」「全期間」の期間フィルター切り替えができること', async ({ page }) => {
    // 1. アサイン状況画面へ移動
    await page.goto('/assignments');

    // 2. ページヘッダーの確認
    await expect(page.getByText(/メンバーアサイン状況/i).first()).toBeVisible({ timeout: 10000 });

    // 3. 期間ボタン「今週」「今月」「全期間 (総積算)」の確認とクリック
    const weekBtn = page.getByRole('button', { name: /^今週$/ });
    const monthBtn = page.getByRole('button', { name: /^今月$/ });
    const allBtn = page.getByRole('button', { name: /全期間/ });

    await expect(weekBtn).toBeVisible();
    await expect(monthBtn).toBeVisible();
    await expect(allBtn).toBeVisible();

    // 「今月」フィルターをクリック
    await monthBtn.click();
    await expect(page.getByText(/1日〜末日/).first()).toBeVisible();

    // 「全期間」フィルターをクリック
    await allBtn.click();
    await expect(page.getByText(/全タスク合計/).first()).toBeVisible();
  });

});

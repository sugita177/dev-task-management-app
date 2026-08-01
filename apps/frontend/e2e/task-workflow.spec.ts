import { test, expect } from '@playwright/test';

test.describe('DevTaskPro E2E Workflows', () => {

  test.beforeEach(async ({ page }) => {
    // storageStateにより自動認証済みのため、即座にタスク一覧画面へ移動
    await page.goto('/tasks');
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
    await expect(newCard).toBeVisible({ timeout: 15000 });

    // 5. タスクカードをクリックして詳細モーダルを開く
    await newCard.click();

    // 6. 「変更履歴」タブをクリック
    const historyTab = page.getByRole('button', { name: /変更履歴/i });
    await expect(historyTab).toBeVisible({ timeout: 15000 });
    await historyTab.click();

    // 7. 「タスクを起票しました。」がログに含まれていること
    const creationLog = page.getByText(/タスクを起票しました。/i);
    await expect(creationLog).toBeVisible({ timeout: 15000 });
  });

  test('未割り当てタスクにメンバー（田中 太郎）を割り当て（更新）、アサイン状況画面に反映されること', async ({ page }) => {
    // 1. かんばん画面へ移動
    await page.goto('/tasks');

    // 2. 新規未割り当てタスクを作成
    const createBtn = page.getByTestId('create-task-button');
    await expect(createBtn).toBeVisible({ timeout: 15000 });
    await createBtn.click();

    const taskTitle = `Unassigned Task ${Date.now()}`;
    await page.getByTestId('task-title-input').fill(taskTitle);
    await page.getByTestId('submit-create-task-button').click();

    // 3. 作成したタスクカードを開いて詳細編集
    const card = page.getByText(taskTitle);
    await expect(card).toBeVisible({ timeout: 15000 });
    await card.click();

    // 4. 詳細モーダルで担当者セレクトボックスから「田中 太郎」を選択して更新保存
    const editAssigneeSelect = page.getByTestId('edit-assignee-select');
    await expect(editAssigneeSelect).toBeVisible({ timeout: 15000 });
    await editAssigneeSelect.selectOption({ label: '田中 太郎' });
    await page.getByTestId('submit-edit-task-button').click();

    // 5. アサイン状況画面へ移動し、田中 太郎の枠内にアサインされたことを確認
    await page.goto('/assignments');
    await expect(page.getByText(/メンバーアサイン状況/i).first()).toBeVisible({ timeout: 15000 });

    const assignedTaskText = page.getByText(taskTitle);
    await expect(assignedTaskText).toBeVisible({ timeout: 15000 });
  });

  test('アサイン状況画面で「今週」「今月」「全期間」の期間フィルター切り替えができること', async ({ page }) => {
    // 1. アサイン状況画面へ移動
    await page.goto('/assignments');
    await expect(page.getByText(/メンバーアサイン状況/i).first()).toBeVisible({ timeout: 15000 });

    // 2. 「今週」ボタンをクリック
    const thisWeekBtn = page.getByRole('button', { name: '今週' });
    await expect(thisWeekBtn).toBeVisible({ timeout: 15000 });
    await thisWeekBtn.click();

    // 3. 「今月」ボタンをクリック
    const thisMonthBtn = page.getByRole('button', { name: '今月' });
    await expect(thisMonthBtn).toBeVisible({ timeout: 15000 });
    await thisMonthBtn.click();

    // 4. 「全期間」ボタンをクリック
    const allPeriodBtn = page.getByRole('button', { name: '全期間' });
    await expect(allPeriodBtn).toBeVisible({ timeout: 15000 });
    await allPeriodBtn.click();
  });

});

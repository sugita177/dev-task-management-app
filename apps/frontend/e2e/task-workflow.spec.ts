import { test, expect } from '@playwright/test';

test.describe('DevTaskPro E2E Workflows', () => {

  test('新規タスク作成フロー（バックエンド連携・モーダル入力）', async ({ page }) => {
    // 1. タスク一覧画面（かんばん）へ移動
    await page.goto('/tasks');

    // 2. 新規タスク作成ボタンをクリック
    const createBtn = page.getByTestId('create-task-button');
    await expect(createBtn).toBeVisible({ timeout: 15000 });
    await createBtn.click();

    // 3. モーダルでタスク情報を入力
    const taskTitle = `E2E Test Task ${Date.now()}`;
    await page.getByTestId('task-title-input').fill(taskTitle);
    await page.getByTestId('task-desc-input').fill('E2E自動テストで作成されたタスクです');
    
    // 4. 起票実行
    await page.getByTestId('submit-create-task-button').click();

    // 5. 新規作成されたタスクカードがかんばんボード上に表示されていることを確認
    const taskCard = page.getByText(taskTitle);
    await expect(taskCard).toBeVisible({ timeout: 15000 });
  });

  test('タスクのステータス更新フロー（かんばん詳細モーダル経由）', async ({ page }) => {
    // 1. かんばん画面へ移動
    await page.goto('/tasks');

    // 2. 新規タスクを作成
    const createBtn = page.getByTestId('create-task-button');
    await expect(createBtn).toBeVisible({ timeout: 15000 });
    await createBtn.click();

    const taskTitle = `Status Update Task ${Date.now()}`;
    await page.getByTestId('task-title-input').fill(taskTitle);
    await page.getByTestId('submit-create-task-button').click();

    // 3. 作成したタスクカードを開く
    const taskCard = page.getByText(taskTitle);
    await expect(taskCard).toBeVisible({ timeout: 15000 });
    await taskCard.click();

    // 4. 詳細モーダルでステータスを「進行中」へ変更
    const editStatusSelect = page.getByTestId('edit-status-select');
    await expect(editStatusSelect).toBeVisible({ timeout: 15000 });
    await editStatusSelect.selectOption('IN_PROGRESS');

    // 5. 更新保存
    await page.getByTestId('submit-edit-task-button').click();
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

    // 全体表示ボタンをクリックしてチーム全体のカードを表示
    const allAssignmentsBtn = page.getByRole('button', { name: /全体表示/i });
    if (await allAssignmentsBtn.isVisible()) {
      await allAssignmentsBtn.click();
    }

    const assignedTaskText = page.getByText(taskTitle);
    await expect(assignedTaskText).toBeVisible({ timeout: 15000 });
  });

  test('アサイン状況画面で「今週」「今月」「全期間」の期間フィルター切り替えができること', async ({ page }) => {
    // 1. アサイン状況画面へ移動
    await page.goto('/assignments');
    await expect(page.getByText(/メンバーアサイン状況/i).first()).toBeVisible({ timeout: 15000 });

    // 2. 「今月」フィルターをクリック
    const monthBtn = page.getByRole('button', { name: '今月' });
    await expect(monthBtn).toBeVisible({ timeout: 15000 });
    await monthBtn.click();

    // 3. 「全期間」フィルターをクリック
    const allBtn = page.getByRole('button', { name: '全期間' });
    await expect(allBtn).toBeVisible({ timeout: 15000 });
    await allBtn.click();
  });

  test('タスク依存関係の設定およびかんばんカード上の依存バッジ・吹き出し表示フロー', async ({ page }) => {
    // 1. かんばん画面へ移動
    await page.goto('/tasks');

    // 2. 先行タスク（Task A）を作成
    const createBtn = page.getByTestId('create-task-button');
    await expect(createBtn).toBeVisible({ timeout: 15000 });
    await createBtn.click();
    const taskATitle = `Predecessor Task ${Date.now()}`;
    await page.getByTestId('task-title-input').fill(taskATitle);
    await page.getByTestId('submit-create-task-button').click();

    // 3. 後続タスク（Task B）を作成
    await expect(createBtn).toBeVisible({ timeout: 15000 });
    await createBtn.click();
    const taskBTitle = `Successor Task ${Date.now()}`;
    await page.getByTestId('task-title-input').fill(taskBTitle);
    await page.getByTestId('submit-create-task-button').click();

    // 4. Task B を開いて依存関係タブから Task A を先行タスクとして登録
    const cardB = page.getByText(taskBTitle);
    await expect(cardB).toBeVisible({ timeout: 15000 });
    await cardB.click();

    // モーダル内の依存関係タブをクリック
    const depTabBtn = page.getByRole('button', { name: /依存関係/i });
    await expect(depTabBtn).toBeVisible({ timeout: 15000 });
    await depTabBtn.click();

    // 先行タスク追加ドロップダウンを選択
    const predSelect = page.locator('select').filter({ hasText: '-- 先行タスクを選択して追加 --' });
    await expect(predSelect).toBeVisible({ timeout: 15000 });
    const targetOption = predSelect.locator('option', { hasText: taskATitle });
    const optionVal = await targetOption.getAttribute('value');
    if (optionVal) {
      await predSelect.selectOption(optionVal);
    }

    // モーダル内の「🔗 先行タスクの設定」セクションの「追加」ボタンをクリック
    const predSection = page.locator('div').filter({ hasText: '🔗 先行タスクの設定' });
    const addDepBtn = predSection.getByRole('button', { name: '追加', exact: true }).first();
    await expect(addDepBtn).toBeVisible({ timeout: 15000 });
    await addDepBtn.click();

    // モーダル右上ヘッダーの閉じるボタン（✕）をクリックしてモーダルを破棄
    const closeModalBtn = page.locator('.fixed.inset-0 button').first();
    await expect(closeModalBtn).toBeVisible({ timeout: 15000 });
    await closeModalBtn.click();
    await expect(page.locator('.fixed.inset-0')).toBeHidden({ timeout: 10000 });

    // 5. かんばんボード上の Task B カード内に「🔗 先行」バッジが表示されることを確認
    const cardBContainer = page.locator('div').filter({ hasText: taskBTitle }).first();
    const predBadge = cardBContainer.getByText(/🔗 先行/i).first();
    await expect(predBadge).toBeVisible({ timeout: 15000 });

    // 6. バッジにホバーし、吹き出しポップオーバーに Task A のタイトルが表示されることを確認
    await predBadge.hover();
    await expect(page.getByText(taskATitle).first()).toBeVisible({ timeout: 15000 });
  });

});

import { chromium, type FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalSetup(config: FullConfig) {
  console.log('テスト用DBコンテナ (db_test) を起動しています...');

  const rootDir = path.resolve(__dirname, '../../');

  execSync('docker compose -f docker-compose.test.yml up db_test -d', {
    cwd: rootDir,
    stdio: 'inherit',
  });

  try {
    console.log('DBの起動を待機しています...');
    execSync('npx wait-on tcp:5433 -t 30000', { stdio: 'inherit' });
    console.log('テスト用DBコンテナの準備が完了しました。');
  } catch (error) {
    console.error('テスト用DBコンテナの起動待機中にタイムアウトしました。コンテナを破棄します。');
    execSync('docker compose -f docker-compose.test.yml down -v', { cwd: rootDir });
    throw error;
  }

  // 認証セッション (storageState.json) の自動作成
  console.log('認証セッション (storageState.json) の事前生成を開始します...');
  const baseURL = config.projects[0]?.use.baseURL || 'http://localhost:5174';

  try {
    execSync('npx wait-on http://localhost:5174 -t 60000', { stdio: 'inherit' });
  } catch (err) {
    console.log('Webサーバーの起動を待機中...');
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(`${baseURL}/login`);
    const demoBtn = page.getByRole('button', { name: /Satoshi Manager/i });
    await demoBtn.click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    const authDir = path.resolve(__dirname, 'playwright/.auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    const authFile = path.join(authDir, 'user.json');
    await page.context().storageState({ path: authFile });
    console.log(`認証セッション情報を保存しました: ${authFile}`);
  } catch (error) {
    console.error('認証セッションの保存中にエラーが発生しました:', error);
  } finally {
    await browser.close();
  }
}

export default globalSetup;

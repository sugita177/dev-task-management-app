import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalSetup() {
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
}

export default globalSetup;

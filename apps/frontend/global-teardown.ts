import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalTeardown() {
  console.log('テスト用DBコンテナ (db_test) を終了・破棄しています...');

  const rootDir = path.resolve(__dirname, '../../');

  try {
    execSync('docker compose -f docker-compose.test.yml stop db_test', { cwd: rootDir, stdio: 'inherit' });
    execSync('docker compose -f docker-compose.test.yml rm -f -v db_test', { cwd: rootDir, stdio: 'inherit' });
  } catch (e) {
    console.error('テスト用DBコンテナの破棄に失敗しました:', e);
  }
}

export default globalTeardown;

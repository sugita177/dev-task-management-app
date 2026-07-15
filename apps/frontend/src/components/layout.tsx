import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* サイドバー */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 text-xl font-bold tracking-wider border-b border-slate-800">
          DevTaskApp
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/" className="block py-2 px-4 rounded hover:bg-slate-800 transition">
            ダッシュボード
          </Link>
          <Link to="/tasks" className="block py-2 px-4 rounded hover:bg-slate-800 transition">
            タスク一覧
          </Link>
          <Link to="/gantt" className="block py-2 px-4 rounded hover:bg-slate-800 transition">
            ガントチャート
          </Link>
          <Link to="/assignments" className="block py-2 px-4 rounded hover:bg-slate-800 transition">
            メンバーアサイン表
          </Link>
          <Link to="/admin/users" className="block py-2 px-4 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition">
            ユーザー管理
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <Link to="/login" className="block py-2 px-4 text-center rounded bg-slate-800 hover:bg-slate-700 transition">
            ログアウト
          </Link>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-xs">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

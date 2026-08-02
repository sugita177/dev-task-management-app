import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api/task-api';
import { useAuthStore } from '../store/auth-store';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((state) => state.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (loginEmail: string, loginPass: string) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const { user } = await authApi.login(loginEmail, loginPass);
      setUser(user);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ログインに失敗しました。認証情報をご確認ください。';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    handleLogin(demoEmail, 'password123');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* 背景装飾のグラデーション光 */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-900/20 blur-3xl"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-violet-900/20 blur-3xl"></div>

      <div className="w-full max-w-4xl bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row backdrop-blur-md z-10">
        
        {/* 左側：ブランドエリア */}
        <div className="w-full md:w-1/2 p-12 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-lg text-white">
              D
            </div>
            <span className="text-lg font-extrabold tracking-wider bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              DevTaskPro
            </span>
          </div>

          <div className="my-16 space-y-4">
            <h1 className="text-3xl font-extrabold leading-tight tracking-wide bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              開発チームのタスクと<br />スケジュールを一本化する。
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              進捗状況の可視化から、アサイン管理、ガントチャート進捗まで、プロジェクトマネージャーとエンジニアを強力につなぐ、次世代の開発タスク管理スイート。
            </p>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            &copy; 2026 DevTaskPro. All rights reserved.
          </div>
        </div>

        {/* 右側：ログインフォーム */}
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white tracking-wide">サインイン</h2>
            <p className="text-xs text-slate-400 mt-2">
              アカウント情報を入力してサービスをご利用ください。
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold leading-relaxed">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">メールアドレス</label>
              <input
                type="email"
                required
                placeholder="satoshi@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-200"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">パスワード</label>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 active:scale-98 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 shadow-lg shadow-indigo-500/10"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'サインイン'
              )}
            </button>
          </form>

          {/* デモ用アカウント選択 */}
          <div className="mt-8 p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-2">
            <p className="text-[11px] font-bold text-slate-400">💡 ワンクリック・デモログイン (パスワード: password123)</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleDemoLogin('satoshi@example.com')}
                className="px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold hover:bg-indigo-500/30 transition"
              >
                Satoshi Manager (EM)
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('tanaka@example.com')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 transition"
              >
                田中 太郎 (Engineer)
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('suzuki@example.com')}
                className="px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-semibold hover:bg-violet-500/30 transition"
              >
                鈴木 一郎 (Engineer)
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

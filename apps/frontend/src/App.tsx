import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/layout';
import ProtectedRoute from './components/protected-route';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import TaskList from './pages/task-list';
import TaskDetail from './pages/task-detail';
import Gantt from './pages/gantt';
import Assignments from './pages/assignments';
import AdminUsers from './pages/admin-users';

// TanStack Queryクライアントの作成
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // ウィンドウフォーカス時の自動再取得をオフにする
      retry: 1, // エラー時のリトライ回数
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* 共通ナビゲーション付きの保護ルーティングレイアウト */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="tasks" element={<TaskList />} />
            <Route path="tasks/:id" element={<TaskDetail />} />
            <Route path="gantt" element={<Gantt />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="admin/users" element={<AdminUsers />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import TaskList from './pages/task-list';
import TaskDetail from './pages/task-detail';
import Gantt from './pages/gantt';
import Assignments from './pages/assignments';
import AdminUsers from './pages/admin-users';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* 共通ナビゲーション付きのレイアウト */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="tasks" element={<TaskList />} />
          <Route path="tasks/:id" element={<TaskDetail />} />
          <Route path="gantt" element={<Gantt />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="admin/users" element={<AdminUsers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

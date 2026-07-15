import { useParams } from 'react-router-dom';

export default function TaskDetail() {
  const { id } = useParams();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">S-004: タスク詳細画面</h1>
      <p className="text-gray-600">タスクID: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-red-600">{id}</span> の詳細情報を表示します。</p>
    </div>
  );
}

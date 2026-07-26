import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';
import { authApi } from '../api/task-api';
import { getCookie } from '../utils/cookie-utils';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, setUser, setIsLoading } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // If not authenticated and not explicitly loaded yet, check is_logged_in cookie first
    if (!isAuthenticated && isLoading) {
      const hasLoggedInCookie = getCookie('is_logged_in');
      if (!hasLoggedInCookie) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      authApi
        .me()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isAuthenticated, isLoading, setUser, setIsLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold">認証状態を確認中...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

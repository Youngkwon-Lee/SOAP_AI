import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  console.log('🔐 PrivateRoute 체크:', {
    currentUser: currentUser ? '로그인됨' : '로그아웃됨',
    uid: currentUser?.uid || 'null',
    loading
  });
  
  // 로딩 중일 때는 로딩 스피너 표시
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!currentUser) {
    console.log('🚫 인증되지 않은 사용자, /auth로 리다이렉트');
    return <Navigate to="/auth" replace />;
  }

  console.log('✅ 인증 완료, 페이지 렌더링');
  return <>{children}</>;
};

export default PrivateRoute; 
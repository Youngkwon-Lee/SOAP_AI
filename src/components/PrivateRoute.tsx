import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();
  
  console.log('🔐 PrivateRoute 체크:', {
    currentUser: currentUser ? '로그인됨' : '로그아웃됨',
    uid: currentUser?.uid || 'null'
  });
  
  // 임시로 인증 체크 비활성화 (데모 모드)
  if (false && !currentUser) {
    console.log('🚫 인증되지 않은 사용자, /auth로 리다이렉트');
    return <Navigate to="/auth" />;
  }
  
  if (!currentUser) {
    console.log('⚠️ 데모 모드: 인증 우회하여 진행');
  }

  console.log('✅ 인증 완료, 페이지 렌더링');
  return <>{children}</>;
};

export default PrivateRoute; 
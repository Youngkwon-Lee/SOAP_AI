import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { initializeTemplatesForNewUser } from '../services/templateInitializer';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔍 Auth 상태 변경:', user ? '로그인됨' : '로그아웃됨');
      setCurrentUser(user);
      
      // 사용자가 로그인했을 때 기본 템플릿 초기화
      if (user) {
        try {
          console.log('📝 사용자 로그인 확인, 템플릿 초기화 시작...');
          await initializeTemplatesForNewUser();
          console.log('✅ 기본 템플릿 초기화 완료');
        } catch (error) {
          console.error('❌ 기본 템플릿 초기화 실패:', error);
          // 오류가 발생해도 로그인 과정은 계속 진행
          console.log('⚠️ 템플릿 초기화 실패했지만 앱은 계속 동작합니다');
        }
      }
      
      console.log('🏁 Auth 로딩 완료, loading을 false로 설정');
      setLoading(false);
    });

    // 5초 후 강제로 로딩 종료 (디버깅용)
    const timeoutId = setTimeout(() => {
      console.log('⏰ 5초 타임아웃 - 강제로 로딩 종료');
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column'
        }}>
          <div>🔄 SOAP AI 로딩 중...</div>
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            인증 상태를 확인하고 있습니다
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export default AuthContext; 
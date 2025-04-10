import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import userService from '../services/userService';
import '../styles/AuthPage.css';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // 로그인 처리
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } else {
        // 회원가입 처리
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 사용자 프로필 생성
        await userService.createUserProfile(userCredential.user);
        
        navigate('/');
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err.message || '인증 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // 신규 사용자인 경우 프로필 생성
      // Google 인증의 경우 additionalUserInfo.isNewUser 값을 통해 신규 사용자를 확인할 수 있지만,
      // 여기서는 간단하게 처리하기 위해 항상 프로필을 확인하고 없으면 생성하는 방식으로 구현
      
      try {
        const profile = await userService.getUserProfile();
        if (!profile) {
          await userService.createUserProfile(userCredential.user);
        }
      } catch (profileError) {
        console.error('프로필 생성 오류:', profileError);
        // 프로필 생성 실패는 로그인 자체를 실패시키지 않음
      }
      
      navigate('/');
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Google 로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>{isLogin ? '로그인' : '회원가입'}</h2>
          
          {error && <div className="auth-error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-button" 
              disabled={loading}
            >
              {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
            </button>
          </form>
          
          <div className="auth-divider">
            <span>또는</span>
          </div>
          
          <button 
            className="google-button" 
            onClick={handleGoogleSignIn} 
            disabled={loading}
          >
            Google로 계속하기
          </button>
          
          <p className="auth-toggle">
            {isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
            <button 
              type="button" 
              onClick={toggleAuthMode} 
              className="toggle-link"
            >
              {isLogin ? '회원가입' : '로그인'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 
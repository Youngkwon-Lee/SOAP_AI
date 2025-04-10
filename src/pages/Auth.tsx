import React, { useState } from 'react';
import { auth } from '../services/firebaseConfig';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import googleIcon from '../assets/google-icon.svg';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (error) {
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (error) {
      setError('구글 로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>SOAP 노트 작성</h1>
        
        <button className="google-login-btn" onClick={handleGoogleLogin}>
          <img src={googleIcon} alt="Google" />
          Google로 계속하기
        </button>

        <div className="auth-divider">
          <span>또는</span>
        </div>

        <form onSubmit={handleEmailLogin}>
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="button primary" style={{ width: '100%' }}>
            로그인
          </button>
        </form>

        <div className="auth-footer">
          <p>계정이 없으신가요? <a href="/signup">회원가입</a></p>
        </div>
      </div>
    </div>
  );
};

export default Auth; 
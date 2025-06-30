import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import userService from '../services/userService';
import EmailPasswordForm from '../components/auth/EmailPasswordForm';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import { validatePassword } from '../utils/validation';
import { getAuthErrorMessage } from '../utils/errorHandler';
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

    if (!isLogin) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setError(passwordValidation.message);
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await userService.createUserProfile(userCredential.user);
      }
      navigate('/');
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(getAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: GoogleAuthProvider | GithubAuthProvider) => {
    setError('');
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const profile = await userService.getUserProfile();
      if (!profile) {
        await userService.createUserProfile(userCredential.user);
      }
      navigate('/');
    } catch (err: any) {
      console.error('Social sign-in error:', err);
      setError(getAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => handleSocialSignIn(new GoogleAuthProvider());
  const handleGithubSignIn = () => handleSocialSignIn(new GithubAuthProvider());

  const handlePasswordReset = async () => {
    const emailForReset = prompt('비밀번호를 재설정할 이메일 주소를 입력하세요.');
    if (emailForReset) {
      try {
        await sendPasswordResetEmail(auth, emailForReset);
        alert('비밀번호 재설정 이메일이 발송되었습니다. 이메일함을 확인해주세요.');
      } catch (err: any) {
        setError(getAuthErrorMessage(err.code));
      }
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
          
          <EmailPasswordForm
            isLogin={isLogin}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            handleSubmit={handleSubmit}
            loading={loading}
            handlePasswordReset={handlePasswordReset}
          />
          
          <SocialLoginButtons
            handleGoogleSignIn={handleGoogleSignIn}
            handleGithubSignIn={handleGithubSignIn}
            loading={loading}
          />
          
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


import React from 'react';

interface EmailPasswordFormProps {
  isLogin: boolean;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  handlePasswordReset: () => void;
}

const EmailPasswordForm: React.FC<EmailPasswordFormProps> = ({
  isLogin,
  email,
  setEmail,
  password,
  setPassword,
  handleSubmit,
  loading,
  handlePasswordReset,
}) => {
  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>이메일</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="form-group">
        <label>비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={isLogin ? "current-password" : "new-password"}
        />
      </div>

      {isLogin && (
        <div className="password-reset-link">
          <button type="button" onClick={handlePasswordReset} className="toggle-link">
            비밀번호를 잊으셨나요?
          </button>
        </div>
      )}

      <button
        type="submit"
        className="auth-button"
        disabled={loading}
      >
        {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
      </button>
    </form>
  );
};

export default EmailPasswordForm;


import React from 'react';

interface SocialLoginButtonsProps {
  handleGoogleSignIn: () => void;
  handleGithubSignIn: () => void;
  loading: boolean;
}

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({ handleGoogleSignIn, handleGithubSignIn, loading }) => {
  return (
    <>
      <div className="auth-divider">
        <span>또는</span>
      </div>
      <div className="social-buttons-container">
        <button
          className="google-button"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          Google로 계속하기
        </button>
        <button
          className="github-button"
          onClick={handleGithubSignIn}
          disabled={loading}
        >
          GitHub로 계속하기
        </button>
      </div>
    </>
  );
};

export default SocialLoginButtons;

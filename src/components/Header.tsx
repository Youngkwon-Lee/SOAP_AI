import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, signOut } = useAuth();
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || '사용자';
  const [credits] = React.useState({ text: 3, audio: 3 });

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleBuyCredits = () => {
    alert('크레딧 구매 페이지로 이동합니다.');
    // 실제 구현에서는 결제 페이지로 이동
  };

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      try {
        await signOut();
        navigate('/auth');
      } catch (error) {
        console.error('로그아웃 오류:', error);
        alert('로그아웃 중 오류가 발생했습니다.');
      }
    }
  };

  const handleFacebookGroupClick = () => {
    window.open('https://facebook.com/groups/soapnoteai', '_blank');
  };

  return (
    <header className="header">
      <div className="logo-container" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
        <h1>SOAPNoteAI.com</h1>
      </div>
      <div className="user-info">
        <span>Hello, {userName}</span>
        <span>Credits Remaining - Text: {credits.text} Audio: {credits.audio}</span>
        <button className="button buy-credits" onClick={handleBuyCredits}>Buy Credits</button>
        <button className="button logout" onClick={handleLogout}>Logout</button>
      </div>
      <div className="facebook-banner" onClick={handleFacebookGroupClick} style={{ cursor: 'pointer' }}>
        <p>Click here to join our private Facebook group to learn more about SOAP Note AI and get support from our community.</p>
      </div>
    </header>
  );
};

export default Header; 
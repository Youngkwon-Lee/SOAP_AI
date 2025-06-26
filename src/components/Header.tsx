import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Header.css';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || '사용자';

  const handleLogoClick = () => {
    navigate('/');
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

  return (
    <header className="modern-header">
      <div className="header-content">
        {/* 로고 */}
        <div className="logo-section" onClick={handleLogoClick}>
          <div className="logo-icon">🏥</div>
          <span className="logo-text">SOAP AI</span>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="nav-menu">
          <button 
            className="nav-item"
            onClick={() => navigate('/')}
          >
            📝 새 노트
          </button>
          <button 
            className="nav-item"
            onClick={() => navigate('/all-notes')}
          >
            📚 내 노트
          </button>
          <button 
            className="nav-item"
            onClick={() => navigate('/patients')}
          >
            👥 환자 관리
          </button>
        </nav>

        {/* 사용자 메뉴 */}
        <div className="user-section">
          <div 
            className="user-profile"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="user-name">{userName}</span>
            <span className="dropdown-arrow">▼</span>
          </div>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-dropdown-item">
                <span>👤 프로필</span>
              </div>
              <div className="user-dropdown-item">
                <span>⚙️ 설정</span>
              </div>
              <div className="user-dropdown-divider"></div>
              <div 
                className="user-dropdown-item logout"
                onClick={handleLogout}
              >
                <span>🚪 로그아웃</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 
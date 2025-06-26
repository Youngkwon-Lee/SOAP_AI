import React, { useState, useEffect } from 'react';
import '../styles/PWAInstaller.css';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstaller: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // iOS 감지
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // 이미 설치된 상태인지 확인
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // PWA가 이미 설치되었는지 확인
    if (standalone || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    // beforeinstallprompt 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // 사용자가 아직 설치하지 않았고, 며칠 후에 다시 보여주기
      const lastPromptTime = localStorage.getItem('pwa-install-prompt-time');
      const now = Date.now();
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      
      if (!lastPromptTime || now - parseInt(lastPromptTime) > threeDays) {
        setTimeout(() => setShowInstallPrompt(true), 3000); // 3초 후 표시
      }
    };

    // 앱 설치 완료 감지
    const handleAppInstalled = () => {
      console.log('✅ PWA 설치 완료');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ 사용자가 PWA 설치를 수락했습니다');
      } else {
        console.log('❌ 사용자가 PWA 설치를 거부했습니다');
        // 거부한 경우 일주일 후에 다시 표시
        localStorage.setItem('pwa-install-prompt-time', Date.now().toString());
      }
      
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    } catch (error) {
      console.error('PWA 설치 오류:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-prompt-time', Date.now().toString());
  };

  // 이미 설치되었거나 iOS에서 이미 홈 화면에 추가된 경우 표시하지 않음
  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  // iOS용 설치 안내
  if (isIOS) {
    return (
      <div className="pwa-installer ios-installer">
        <div className="install-card">
          <div className="install-header">
            <div className="install-icon">📱</div>
            <h3>앱으로 설치하기</h3>
            <button className="dismiss-btn" onClick={handleDismiss}>×</button>
          </div>
          
          <div className="install-content">
            <p>SOAP AI를 홈 화면에 추가하여 앱처럼 사용하세요!</p>
            
            <div className="ios-instructions">
              <div className="instruction-step">
                <span className="step-icon">1️⃣</span>
                <span>하단의 공유 버튼 <strong>⎙</strong>을 탭하세요</span>
              </div>
              <div className="instruction-step">
                <span className="step-icon">2️⃣</span>
                <span><strong>"홈 화면에 추가"</strong>를 선택하세요</span>
              </div>
              <div className="instruction-step">
                <span className="step-icon">3️⃣</span>
                <span><strong>"추가"</strong>를 탭하여 완료하세요</span>
              </div>
            </div>
            
            <div className="benefits">
              <h4>🎯 앱 설치 혜택</h4>
              <ul>
                <li>✨ 더 빠른 접속</li>
                <li>📱 전체 화면 경험</li>
                <li>🔄 오프라인 사용 가능</li>
                <li>🔔 알림 받기</li>
              </ul>
            </div>
          </div>
          
          <div className="install-actions">
            <button className="later-btn" onClick={handleDismiss}>
              나중에
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Android/Desktop용 설치 프롬프트
  return (
    <div className="pwa-installer">
      <div className="install-card">
        <div className="install-header">
          <div className="install-icon">🚀</div>
          <h3>SOAP AI 앱 설치</h3>
          <button className="dismiss-btn" onClick={handleDismiss}>×</button>
        </div>
        
        <div className="install-content">
          <p>SOAP AI를 컴퓨터나 모바일에 앱으로 설치하세요!</p>
          
          <div className="benefits">
            <h4>🎯 설치 혜택</h4>
            <ul>
              <li>⚡ 빠른 실행</li>
              <li>📱 독립적인 앱 창</li>
              <li>🔄 오프라인 작업</li>
              <li>🔔 알림 기능</li>
              <li>🎨 네이티브 앱 경험</li>
            </ul>
          </div>
          
          <div className="install-preview">
            <div className="preview-phone">
              <div className="phone-screen">
                <div className="app-icon">🩺</div>
                <div className="app-name">SOAP AI</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="install-actions">
          <button className="later-btn" onClick={handleDismiss}>
            나중에
          </button>
          <button className="install-btn" onClick={handleInstallClick}>
            지금 설치
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstaller;
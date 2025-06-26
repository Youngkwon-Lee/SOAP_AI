import React, { useState, useEffect } from 'react';
import { onNetworkChange, getUnsyncedNotes, requestBackgroundSync } from '../services/offlineStorage';
import '../styles/OfflineStatus.css';

const OfflineStatus: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const updateUnsyncedCount = () => {
      setUnsyncedCount(getUnsyncedNotes().length);
    };

    const cleanup = onNetworkChange((online) => {
      setIsOffline(!online);
      
      if (online && unsyncedCount > 0) {
        // 온라인이 되면 자동으로 동기화 시도
        handleSync();
      }
    });

    updateUnsyncedCount();
    
    // 정기적으로 미동기화 노트 수 업데이트
    const interval = setInterval(updateUnsyncedCount, 5000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [unsyncedCount]);

  const handleSync = async () => {
    if (isOffline || syncing) return;
    
    setSyncing(true);
    try {
      // 백그라운드 동기화 요청
      requestBackgroundSync('background-sync-notes');
      
      // 몇 초 후 상태 업데이트
      setTimeout(() => {
        setUnsyncedCount(getUnsyncedNotes().length);
        setSyncing(false);
      }, 2000);
    } catch (error) {
      console.error('동기화 실패:', error);
      setSyncing(false);
    }
  };

  // 온라인이고 동기화할 노트가 없으면 표시하지 않음
  if (!isOffline && unsyncedCount === 0) {
    return null;
  }

  return (
    <div className={`offline-status ${isOffline ? 'offline' : 'online'}`}>
      <div className="status-main" onClick={() => setShowDetail(!showDetail)}>
        <div className="status-indicator">
          {isOffline ? (
            <span className="status-icon offline-icon">📡</span>
          ) : syncing ? (
            <span className="status-icon syncing-icon">🔄</span>
          ) : (
            <span className="status-icon online-icon">✅</span>
          )}
        </div>
        
        <div className="status-text">
          {isOffline ? (
            <span>오프라인 모드</span>
          ) : syncing ? (
            <span>동기화 중...</span>
          ) : (
            <span>동기화 대기 중</span>
          )}
          
          {unsyncedCount > 0 && (
            <span className="unsynced-count">
              {unsyncedCount}개 노트
            </span>
          )}
        </div>

        <button 
          className="toggle-detail"
          aria-label="상세 정보 토글"
        >
          {showDetail ? '▼' : '▶'}
        </button>
      </div>

      {showDetail && (
        <div className="status-detail">
          {isOffline ? (
            <div className="offline-info">
              <h4>🔌 오프라인 상태</h4>
              <p>인터넷 연결이 끊어졌습니다.</p>
              <ul>
                <li>✅ 노트 작성 계속 가능</li>
                <li>💾 로컬에 자동 저장됨</li>
                <li>🔄 온라인 시 자동 동기화</li>
              </ul>
              
              {unsyncedCount > 0 && (
                <div className="unsynced-info">
                  <strong>{unsyncedCount}개의 노트</strong>가 동기화를 기다리고 있습니다.
                </div>
              )}
            </div>
          ) : (
            <div className="online-info">
              <h4>🌐 온라인 상태</h4>
              {unsyncedCount > 0 ? (
                <div className="sync-pending">
                  <p><strong>{unsyncedCount}개의 노트</strong>가 동기화를 기다리고 있습니다.</p>
                  
                  <button 
                    className="sync-btn"
                    onClick={handleSync}
                    disabled={syncing}
                  >
                    {syncing ? (
                      <>
                        <span className="spinner"></span>
                        동기화 중...
                      </>
                    ) : (
                      '지금 동기화'
                    )}
                  </button>
                </div>
              ) : (
                <p>모든 노트가 동기화되었습니다.</p>
              )}
            </div>
          )}
          
          <div className="status-tips">
            <h5>💡 팁</h5>
            <ul>
              <li>오프라인에서도 노트 작성이 가능합니다</li>
              <li>온라인 연결 시 자동으로 동기화됩니다</li>
              <li>중요한 노트는 온라인에서 작성하세요</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineStatus;
// 오프라인 스토리지 서비스
import React from 'react';
import { SoapNote, PatientInfo } from '../types';

interface OfflineNote {
  id: string;
  soapNote: SoapNote;
  patientInfo: PatientInfo;
  specialty: string;
  createdAt: string;
  synced: boolean;
}

const OFFLINE_NOTES_KEY = 'soap-ai-offline-notes';
const DRAFT_KEY = 'soap-ai-draft';

// 오프라인 노트 저장
export const saveOfflineNote = (
  soapNote: SoapNote,
  patientInfo: PatientInfo,
  specialty: string
): string => {
  try {
    const offlineNotes = getOfflineNotes();
    const noteId = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newNote: OfflineNote = {
      id: noteId,
      soapNote,
      patientInfo,
      specialty,
      createdAt: new Date().toISOString(),
      synced: false
    };
    
    offlineNotes.push(newNote);
    localStorage.setItem(OFFLINE_NOTES_KEY, JSON.stringify(offlineNotes));
    
    console.log('💾 오프라인 노트 저장 완료:', noteId);
    return noteId;
  } catch (error) {
    console.error('❌ 오프라인 노트 저장 실패:', error);
    throw error;
  }
};

// 모든 오프라인 노트 가져오기
export const getOfflineNotes = (): OfflineNote[] => {
  try {
    const stored = localStorage.getItem(OFFLINE_NOTES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('❌ 오프라인 노트 로드 실패:', error);
    return [];
  }
};

// 미동기화된 노트만 가져오기
export const getUnsyncedNotes = (): OfflineNote[] => {
  return getOfflineNotes().filter(note => !note.synced);
};

// 노트를 동기화됨으로 표시
export const markNoteSynced = (noteId: string): void => {
  try {
    const offlineNotes = getOfflineNotes();
    const noteIndex = offlineNotes.findIndex(note => note.id === noteId);
    
    if (noteIndex !== -1) {
      offlineNotes[noteIndex].synced = true;
      localStorage.setItem(OFFLINE_NOTES_KEY, JSON.stringify(offlineNotes));
      console.log('✅ 노트 동기화 표시 완료:', noteId);
    }
  } catch (error) {
    console.error('❌ 노트 동기화 표시 실패:', error);
  }
};

// 동기화된 노트 삭제
export const removeSyncedNotes = (): void => {
  try {
    const offlineNotes = getOfflineNotes();
    const unsyncedNotes = offlineNotes.filter(note => !note.synced);
    localStorage.setItem(OFFLINE_NOTES_KEY, JSON.stringify(unsyncedNotes));
    console.log('🗑️ 동기화된 오프라인 노트 삭제 완료');
  } catch (error) {
    console.error('❌ 동기화된 노트 삭제 실패:', error);
  }
};

// 초안 저장 (실시간 자동 저장용)
export const saveDraft = (
  patientInfo: PatientInfo,
  notes: string,
  specialty: string
): void => {
  try {
    const draft = {
      patientInfo,
      notes,
      specialty,
      savedAt: new Date().toISOString()
    };
    
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error('❌ 초안 저장 실패:', error);
  }
};

// 초안 불러오기
export const loadDraft = () => {
  try {
    const stored = localStorage.getItem(DRAFT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('❌ 초안 로드 실패:', error);
    return null;
  }
};

// 초안 삭제
export const clearDraft = (): void => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    console.error('❌ 초안 삭제 실패:', error);
  }
};

// 온라인 상태 감지
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// 네트워크 상태 변경 감지
export const onNetworkChange = (callback: (online: boolean) => void) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // 정리 함수 반환
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// 백그라운드 동기화 요청
export const requestBackgroundSync = (tag: string): void => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      return (registration as any).sync.register(tag);
    }).catch((error) => {
      console.error('❌ 백그라운드 동기화 등록 실패:', error);
    });
  }
};

// 스토리지 공간 확인
export const getStorageUsage = async (): Promise<{
  used: number;
  quota: number;
  percentage: number;
}> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (used / quota) * 100 : 0;
      
      return { used, quota, percentage };
    } catch (error) {
      console.error('❌ 스토리지 사용량 확인 실패:', error);
    }
  }
  
  return { used: 0, quota: 0, percentage: 0 };
};

// 오프라인 상태 표시 컴포넌트용 훅
export const useOfflineStatus = () => {
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);
  const [unsyncedCount, setUnsyncedCount] = React.useState(0);
  
  React.useEffect(() => {
    const updateUnsyncedCount = () => {
      setUnsyncedCount(getUnsyncedNotes().length);
    };
    
    const cleanup = onNetworkChange((online) => {
      setIsOffline(!online);
      if (online) {
        // 온라인이 되면 백그라운드 동기화 요청
        requestBackgroundSync('background-sync-notes');
      }
    });
    
    updateUnsyncedCount();
    
    // 정기적으로 미동기화 노트 수 업데이트
    const interval = setInterval(updateUnsyncedCount, 5000);
    
    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, []);
  
  return { isOffline, unsyncedCount };
};

export default {
  saveOfflineNote,
  getOfflineNotes,
  getUnsyncedNotes,
  markNoteSynced,
  removeSyncedNotes,
  saveDraft,
  loadDraft,
  clearDraft,
  isOnline,
  onNetworkChange,
  requestBackgroundSync,
  getStorageUsage,
  useOfflineStatus
};
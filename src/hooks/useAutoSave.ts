import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions {
  delay?: number; // 저장 지연 시간 (ms)
  key: string; // localStorage 키
  enabled?: boolean; // 자동 저장 활성화 여부
}

interface UseAutoSaveReturn<T> {
  saveToLocal: (data: T) => void;
  loadFromLocal: () => T | null;
  clearLocal: () => void;
  hasSavedData: () => boolean;
}

export function useAutoSave<T>(
  data: T,
  options: UseAutoSaveOptions
): UseAutoSaveReturn<T> {
  const { delay = 2000, key, enabled = true } = options;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousDataRef = useRef<string>('');

  // 로컬 스토리지에 저장
  const saveToLocal = useCallback((dataToSave: T) => {
    try {
      const serialized = JSON.stringify({
        data: dataToSave,
        timestamp: new Date().toISOString(),
        version: '1.0'
      });
      localStorage.setItem(`autosave_${key}`, serialized);
      console.log(`🔄 자동 저장됨: ${key}`);
    } catch (error) {
      console.error('자동 저장 실패:', error);
    }
  }, [key]);

  // 로컬 스토리지에서 불러오기
  const loadFromLocal = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(`autosave_${key}`);
      if (!saved) return null;
      
      const parsed = JSON.parse(saved);
      return parsed.data as T;
    } catch (error) {
      console.error('자동 저장 데이터 복원 실패:', error);
      return null;
    }
  }, [key]);

  // 로컬 스토리지 데이터 삭제
  const clearLocal = useCallback(() => {
    localStorage.removeItem(`autosave_${key}`);
    console.log(`🗑️ 자동 저장 데이터 삭제: ${key}`);
  }, [key]);

  // 저장된 데이터가 있는지 확인
  const hasSavedData = useCallback((): boolean => {
    return localStorage.getItem(`autosave_${key}`) !== null;
  }, [key]);

  // 데이터가 변경될 때마다 지연 저장
  useEffect(() => {
    if (!enabled) return;

    const currentData = JSON.stringify(data);
    
    // 데이터가 실제로 변경되었는지 확인
    if (currentData === previousDataRef.current) return;
    
    // 기존 타이머 클리어
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 새 타이머 설정
    timeoutRef.current = setTimeout(() => {
      saveToLocal(data);
      previousDataRef.current = currentData;
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, saveToLocal]);

  // 컴포넌트 언마운트 시 즉시 저장
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        if (enabled) {
          saveToLocal(data);
        }
      }
    };
  }, [data, enabled, saveToLocal]);

  return {
    saveToLocal,
    loadFromLocal,
    clearLocal,
    hasSavedData
  };
} 
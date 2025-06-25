import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  target?: Element | Window;
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, target = window } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // 입력 필드에서는 단축키 비활성화
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrl === event.ctrlKey;
        const altMatch = !!shortcut.alt === event.altKey;
        const shiftMatch = !!shortcut.shift === event.shiftKey;

        if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    const targetElement = target as any;
    targetElement.addEventListener('keydown', handleKeyDown);

    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled, target]);

  // 단축키 도움말 생성
  const getShortcutHelp = useCallback(() => {
    return shortcuts.map(shortcut => {
      const keys = [];
      if (shortcut.ctrl) keys.push('Ctrl');
      if (shortcut.alt) keys.push('Alt');
      if (shortcut.shift) keys.push('Shift');
      keys.push(shortcut.key.toUpperCase());
      
      return {
        combination: keys.join(' + '),
        description: shortcut.description
      };
    });
  }, [shortcuts]);

  return {
    getShortcutHelp
  };
}

// 일반적인 단축키들을 위한 헬퍼 함수들
export const createShortcut = (
  key: string,
  action: () => void,
  description: string,
  modifiers: { ctrl?: boolean; alt?: boolean; shift?: boolean } = {}
): KeyboardShortcut => ({
  key,
  action,
  description,
  ...modifiers
});

// SOAP 노트 작성을 위한 기본 단축키들
export const createSoapNoteShortcuts = (callbacks: {
  save?: () => void;
  generate?: () => void;
  clear?: () => void;
  toggleRecording?: () => void;
  focusSubjective?: () => void;
  focusObjective?: () => void;
  focusAssessment?: () => void;
  focusPlan?: () => void;
}): KeyboardShortcut[] => [
  ...(callbacks.save ? [createShortcut('s', callbacks.save, '저장하기', { ctrl: true })] : []),
  ...(callbacks.generate ? [createShortcut('Enter', callbacks.generate, 'SOAP 노트 생성', { ctrl: true })] : []),
  ...(callbacks.clear ? [createShortcut('Delete', callbacks.clear, '내용 지우기', { ctrl: true, shift: true })] : []),
  ...(callbacks.toggleRecording ? [createShortcut('r', callbacks.toggleRecording, '녹음 시작/중지', { ctrl: true })] : []),
  ...(callbacks.focusSubjective ? [createShortcut('1', callbacks.focusSubjective, 'Subjective 섹션으로 이동', { alt: true })] : []),
  ...(callbacks.focusObjective ? [createShortcut('2', callbacks.focusObjective, 'Objective 섹션으로 이동', { alt: true })] : []),
  ...(callbacks.focusAssessment ? [createShortcut('3', callbacks.focusAssessment, 'Assessment 섹션으로 이동', { alt: true })] : []),
  ...(callbacks.focusPlan ? [createShortcut('4', callbacks.focusPlan, 'Plan 섹션으로 이동', { alt: true })] : [])
];

export default useKeyboardShortcuts; 
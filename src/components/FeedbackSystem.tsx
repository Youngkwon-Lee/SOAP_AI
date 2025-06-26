import React, { useState, useEffect } from 'react';

// 알림 타입 정의
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

interface FeedbackSystemProps {
  notifications: Notification[];
  onRemoveNotification: (id: string) => void;
}

// 전역 알림 관리를 위한 Context
let notificationId = 0;
const notificationListeners: ((notifications: Notification[]) => void)[] = [];
let currentNotifications: Notification[] = [];

export const showNotification = (
  type: NotificationType,
  title: string,
  message: string,
  duration: number = 5000
) => {
  const id = `notification-${++notificationId}`;
  const notification: Notification = { id, type, title, message, duration };
  
  currentNotifications = [...currentNotifications, notification];
  notificationListeners.forEach(listener => listener(currentNotifications));

  // 자동 제거
  if (duration > 0) {
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  }

  return id;
};

export const removeNotification = (id: string) => {
  currentNotifications = currentNotifications.filter(n => n.id !== id);
  notificationListeners.forEach(listener => listener(currentNotifications));
};

// 알림 훅
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(currentNotifications);

  useEffect(() => {
    const listener = (newNotifications: Notification[]) => {
      setNotifications(newNotifications);
    };

    notificationListeners.push(listener);

    return () => {
      const index = notificationListeners.indexOf(listener);
      if (index > -1) {
        notificationListeners.splice(index, 1);
      }
    };
  }, []);

  return {
    notifications,
    showSuccess: (title: string, message: string) => 
      showNotification('success', title, message),
    showError: (title: string, message: string) => 
      showNotification('error', title, message, 8000),
    showWarning: (title: string, message: string) => 
      showNotification('warning', title, message),
    showInfo: (title: string, message: string) => 
      showNotification('info', title, message),
    removeNotification
  };
};

// 알림 컴포넌트
const NotificationItem: React.FC<{
  notification: Notification;
  onRemove: (id: string) => void;
}> = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 애니메이션을 위한 지연
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(notification.id), 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  const getColor = () => {
    switch (notification.type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <div 
      className={`notification-item ${isVisible ? 'visible' : ''}`}
      style={{ borderLeft: `4px solid ${getColor()}` }}
    >
      <div className="notification-content">
        <div className="notification-icon">
          {getIcon()}
        </div>
        <div className="notification-text">
          <h4>{notification.title}</h4>
          <p>{notification.message}</p>
        </div>
        <button 
          className="notification-close"
          onClick={handleClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// 메인 피드백 시스템 컴포넌트
export const FeedbackSystem: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
};

// 로딩 스피너 컴포넌트
export const LoadingSpinner: React.FC<{
  size?: 'small' | 'medium' | 'large';
  message?: string;
}> = ({ size = 'medium', message }) => {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  };

  return (
    <div className="loading-container">
      <div className={`loading-spinner ${sizeClasses[size]}`}>
        <div className="spinner"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

// 도움말 툴팁 컴포넌트
export const HelpTooltip: React.FC<{
  content: string;
  children: React.ReactNode;
}> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="tooltip-container"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="tooltip-content">
          {content}
        </div>
      )}
    </div>
  );
};

export default FeedbackSystem;
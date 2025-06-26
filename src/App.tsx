import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import './styles/FeedbackSystem.css';
import HomePage from './pages/HomePage';
import PhysicalTherapyPage from './pages/PhysicalTherapyPage';
import AllNotesPage from './pages/AllNotesPage';
import EditNotePage from './pages/EditNotePage';
import AuthPage from './pages/AuthPage';
import PatientsPage from './pages/PatientsPage';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { FeedbackSystem } from './components/FeedbackSystem';
import { AuthProvider } from './contexts/AuthContext';
import PWAInstaller from './components/PWAInstaller';
import OfflineStatus from './components/OfflineStatus';
import AudioSoapNote from './pages/AudioSoapNote';
import SoapNotePage from './pages/SoapNotePage';
import UnifiedSoapNotePage from './pages/UnifiedSoapNotePage';

function App() {
  // 서비스 워커 등록
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('✅ 서비스 워커 등록 성공:', registration.scope);
          })
          .catch((error) => {
            console.log('❌ 서비스 워커 등록 실패:', error);
          });
      });
    }
  }, []);

  return (
    <ErrorBoundary>
    <AuthProvider>
      <Router>
        <div className="app">
          <main className="main-content">
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={
                <PrivateRoute>
                  <HomePage />
                </PrivateRoute>
              } />
              <Route path="/soap-note-physical-therapy" element={
                <PrivateRoute>
                  <PhysicalTherapyPage />
                </PrivateRoute>
              } />
              <Route path="/all-notes" element={
                <PrivateRoute>
                  <AllNotesPage />
                </PrivateRoute>
              } />
              <Route path="/edit-note/:noteId" element={
                <PrivateRoute>
                  <EditNotePage />
                </PrivateRoute>
              } />
              <Route path="/patients" element={
                <PrivateRoute>
                  <PatientsPage />
                </PrivateRoute>
              } />
              <Route path="/audio" element={
                <PrivateRoute>
                  <AudioSoapNote />
                </PrivateRoute>
              } />
              <Route path="/soap-note" element={<SoapNotePage />} />
              <Route path="/unified-soap-note" element={
                <PrivateRoute>
                  <UnifiedSoapNotePage />
                </PrivateRoute>
              } />
            </Routes>
          </main>
          
          {/* 전역 피드백 시스템 */}
          <FeedbackSystem />
          
          {/* PWA 설치 프롬프트 */}
          <PWAInstaller />
          
          {/* 오프라인 상태 표시 */}
          <OfflineStatus />
        </div>
      </Router>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

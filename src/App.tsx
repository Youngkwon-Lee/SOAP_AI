import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import PhysicalTherapyPage from './pages/PhysicalTherapyPage';
import AllNotesPage from './pages/AllNotesPage';
import EditNotePage from './pages/EditNotePage';
import AuthPage from './pages/AuthPage';
import PatientsPage from './pages/PatientsPage';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import AudioSoapNote from './pages/AudioSoapNote';
import SoapNotePage from './pages/SoapNotePage';

function App() {
  return (
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
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

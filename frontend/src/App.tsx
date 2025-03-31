import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import components
import Navbar from './components/Navbar';
import Home from './components/Home';
import WorldMap from './components/WorldMap';
import ChatRoom from './components/ChatRoom/ChatRoom';
import Profile from './components/Profile';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Temporary login function for development
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-base-100">
        <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home onLogin={handleLogin} />} />
            <Route
              path="/map"
              element={
                isAuthenticated ? <WorldMap /> : <Navigate to="/" replace />
              }
            />
            <Route
              path="/chat/:placeId"
              element={
                isAuthenticated ? <ChatRoom /> : <Navigate to="/" replace />
              }
            />
            <Route
              path="/profile"
              element={
                isAuthenticated ? <Profile /> : <Navigate to="/" replace />
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

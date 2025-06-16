import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import RecipePage from './pages/RecipePage';
import AllRecipes from './pages/AllRecipes';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import api from './utils/api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  const fetchCurrentUser = useCallback(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => setUser(null));
    }
  }, []);

  // On mount, check for token and fetch user
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const handleLogin = (data) => {
    localStorage.setItem('token', data.token);
    fetchCurrentUser();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const handleRegister = (data) => {
    localStorage.setItem('token', data.token);
    fetchCurrentUser();
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home user={user} onLogout={handleLogout} onUserUpdate={fetchCurrentUser} />} />
        <Route path="/recipes" element={<AllRecipes user={user} onLogout={handleLogout} onUserUpdate={fetchCurrentUser} />} />
        <Route path="/recipe/:id" element={<RecipePage user={user} onLogout={handleLogout} onUserUpdate={fetchCurrentUser} />} />
        <Route path="/dashboard" element={<Dashboard user={user} onLogout={handleLogout} onUserUpdate={fetchCurrentUser} />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register onRegister={handleRegister} />} />
      </Routes>
    </Router>
  );
}

export default App;

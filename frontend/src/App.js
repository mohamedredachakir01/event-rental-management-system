import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

import LoginRegister from './LoginRegister';
import HomePage from './HomePage';
import TraiteurPage from './TraiteurPage';
import ReservationPage from './ReservationPage';
import NotificationPage from './NotificationPage';
import DashboardPage from './DashboardPage';
import ContactPage from './ContactPage';
import PrivateRoute from './PrivateRoute';
import ProfilePage from './ProfilePage';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email');
  const isAdmin = localStorage.getItem('role') === 'admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('traiteurSelection');
    localStorage.removeItem('pendingReservation');
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4">
      <Link className="navbar-brand" to="/">
        EventRent
      </Link>

      <div className="navbar-nav ms-auto gap-3 align-items-center">
        <Link className="nav-link" to="/">
          Accueil
        </Link>
        <Link className="nav-link" to="/contact">
          Contacter nous
        </Link>

        {!token && (
          <Link className="nav-link" to="/login">
            Connexion / Inscription
          </Link>
        )}

        {token && (
          <>
            {isAdmin && (
              <Link className="nav-link" to="/dashboard">
                Dashboard
              </Link>
            )}

            <Link className="nav-link text-info" to="/profile">
              Profile: {isAdmin ? 'Admin' : email}
            </Link>

            <button type="button" className="btn btn-outline-light btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

function AppShell() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginRegister />} />
        <Route
          path="/traiteur"
          element={
            <PrivateRoute>
              <TraiteurPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/reservation"
          element={
            <PrivateRoute>
              <ReservationPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/notification"
          element={
            <PrivateRoute>
              <NotificationPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute requireAdmin>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

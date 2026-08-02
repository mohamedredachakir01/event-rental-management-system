import React, { useEffect, useState } from 'react';
import './styles/ProfilePage.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

function ProfilePage() {
  const [profile, setProfile] = useState({
    email: localStorage.getItem('email') || '',
    role: localStorage.getItem('email') === 'admin@gmail.com' ? 'admin' : 'user',
  });
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
          headers: {
            Authorization: token,
          },
        });

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.msg || 'Impossible de charger le profil.');
        }

        setProfile({
          email: data.user?.email || localStorage.getItem('email') || '',
          role: data.user?.role || (localStorage.getItem('email') === 'admin@gmail.com' ? 'admin' : 'user'),
        });
        setStatusMessage('Profil charge avec succes.');
      } catch (error) {
        console.error(error);
        setStatusMessage('Affichage des informations locales du profil.');
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="profile-page">
      <div className="profile-card shadow-lg">
        <div className="profile-avatar">
          {(profile.email || 'U').charAt(0).toUpperCase()}
        </div>

        <h2>Mon Profil</h2>
        <p className="profile-subtitle">Informations du compte connecte</p>

        <div className="profile-info">
          <div className="profile-info-row">
            <span>Email</span>
            <strong>{profile.email || 'Utilisateur inconnu'}</strong>
          </div>

          <div className="profile-info-row">
            <span>Role</span>
            <strong>{profile.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</strong>
          </div>
        </div>

        {statusMessage && <p className="profile-status">{statusMessage}</p>}
      </div>
    </div>
  );
}

export default ProfilePage;

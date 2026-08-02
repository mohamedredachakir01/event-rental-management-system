import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/LoginRegister.css';
import { apiRequest } from './lib/api';

const initialFormData = {
  name: '',
  email: '',
  password: '',
};

function LoginRegister() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState(initialFormData);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = ({ target }) => {
    setErrorMessage('');
    setFeedbackMessage('');
    setFormData((currentFormData) => ({
      ...currentFormData,
      [target.name]: target.value,
    }));
  };

  const toggleMode = () => {
    setIsLogin((currentMode) => !currentMode);
    setFormData(initialFormData);
    setFeedbackMessage('');
    setErrorMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const endpoint = isLogin ? '/auth/login' : '/auth/register';

    try {
      setIsSubmitting(true);
      const data = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (!isLogin) {
        setIsLogin(true);
        setErrorMessage('');
        setFeedbackMessage('Inscription reussie. Vous pouvez maintenant vous connecter.');
        setFormData({
          name: '',
          email: formData.email,
          password: '',
        });
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('email', data.user?.email || formData.email);
      localStorage.setItem('role', data.user?.role || 'user');

      if (data.user?.role === 'admin') {
        navigate('/dashboard');
        return;
      }

      navigate('/');
    } catch (error) {
      console.error(error);
      setFeedbackMessage('');
      setErrorMessage(error.message || 'Erreur serveur');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <section className="auth-intro">
        <p className="eyebrow">EVENTRENT · EXPÉRIENCES</p>
        <h1>Chaque célébration mérite son moment parfait.</h1>
        <p>Réservez votre événement, votre traiteur et votre décoration depuis un seul espace élégant.</p>
        <div className="auth-intro-stats"><span><strong>+500</strong> événements</span><span><strong>24/7</strong> accompagnement</span></div>
      </section>

      <div className="auth-box">
        <div className="auth-heading">
          <span className="auth-mark">✦</span>
          <p className="eyebrow">BIENVENUE</p>
          <h2>{isLogin ? 'Heureux de vous revoir' : 'Créez votre expérience'}</h2>
          <p>{isLogin ? 'Connectez-vous pour continuer votre organisation.' : 'Quelques informations et votre compte est prêt.'}</p>
        </div>

        {feedbackMessage && (
          <p className="alert alert-success" role="status">
            {feedbackMessage}
          </p>
        )}

        {errorMessage && (
          <p className="alert alert-danger" role="alert">
            {errorMessage}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <label className="field-label">Nom complet<input type="text" name="name" placeholder="Votre nom" value={formData.name} onChange={handleChange} required /></label>
          )}

          <label className="field-label">Adresse e-mail<input type="email" name="email" placeholder="vous@exemple.com" value={formData.email} onChange={handleChange} required /></label>

          <label className="field-label">Mot de passe<input type="password" name="password" placeholder="Minimum 8 caractères" value={formData.password} onChange={handleChange} minLength="8" required /></label>

          <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
            {isSubmitting ? 'Traitement…' : isLogin ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? 'Nouveau chez EventRent ?' : 'Vous avez déjà un compte ?'}
          <button type="button" onClick={toggleMode}>
            {isLogin ? " S'inscrire" : ' Se connecter'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginRegister;

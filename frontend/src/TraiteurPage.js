import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/TraiteurPage.css';
import { apiRequest } from './lib/api';

function TraiteurPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    guests: '',
    food: '',
    drinks: '',
    tables: '',
    chairs: '',
    decor: '',
  });
  const [statusMessage, setStatusMessage] = useState('');

  const decors = [
    { id: 'golden', icon: '✦', title: 'Élégance dorée', text: 'Chic & lumineux' },
    { id: 'garden', icon: '❋', title: 'Jardin bohème', text: 'Nature & douceur' },
    { id: 'midnight', icon: '◐', title: 'Nuit raffinée', text: 'Moderne & intense' },
  ];

  const handleChange = ({ target }) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [target.name]: target.value,
    }));
  };

  const handleDecor = (decor) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      decor,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    localStorage.setItem('traiteurSelection', JSON.stringify(formData));

    try {
      await apiRequest('/traiteurs', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      navigate('/reservation');
    } catch (error) {
      console.error(error);
      setStatusMessage('Vos choix sont conservés localement. Vous pouvez continuer votre réservation.');
      navigate('/reservation');
    }
  };

  return (
    <main className="catering-page">
      <header className="catering-hero">
        <p className="eyebrow">ÉTAPE 1 · PERSONNALISATION</p>
        <h1>Composez une réception<br />à votre image.</h1>
        <p>Choisissez vos préférences et nous nous occupons du reste.</p>
      </header>

      <form onSubmit={handleSubmit} className="catering-form">
        <div className="form-section-title"><span>01</span><div><h2>Vos invités</h2><p>Pour adapter chaque détail à votre réception.</p></div></div>
        <label className="field-label">Nombre d'invités
        <input
          type="number"
          name="guests"
          placeholder="Nombre d invites"
          className="form-control mb-3"
          value={formData.guests}
          onChange={handleChange}
          required
        />
        </label>

        <div className="catering-two-cols">
        <label className="field-label">Cuisine préférée<select
          name="food"
          className="form-control mb-3"
          value={formData.food}
          onChange={handleChange}
          required
        >
          <option value="">Choisir nourriture</option>
          <option>Marocain</option>
          <option>International</option>
          <option>Fast Food</option>
        </select></label>

        <label className="field-label">Boissons<select
          name="drinks"
          className="form-control mb-3"
          value={formData.drinks}
          onChange={handleChange}
          required
        >
          <option value="">Choisir boissons</option>
          <option>Soft Drinks</option>
          <option>Jus</option>
          <option>Eau</option>
        </select></label></div>

        <div className="catering-two-cols"><label className="field-label">Nombre de tables<input
          type="number"
          name="tables"
          placeholder="Nombre de tables"
          className="form-control mb-3"
          value={formData.tables}
          onChange={handleChange}
        /></label>

        <label className="field-label">Nombre de chaises<input
          type="number"
          name="chairs"
          placeholder="Nombre de chaises"
          className="form-control mb-3"
          value={formData.chairs}
          onChange={handleChange}
        /></label></div>

        <div className="form-section-title decor-title"><span>02</span><div><h2>Votre ambiance</h2><p>Sélectionnez le style qui vous inspire.</p></div></div>
        <div className="decor-grid">
          {decors.map((decor) => (
            <button type="button" key={decor.id} className={`decor-card decor-${decor.id} ${formData.decor === decor.id ? 'selected' : ''}`} onClick={() => handleDecor(decor.id)}>
              <span className="decor-icon">{decor.icon}</span><strong>{decor.title}</strong><small>{decor.text}</small><i>✓</i>
            </button>
          ))}
        </div>

        {statusMessage && <p className="catering-status" role="status">{statusMessage}</p>}
        <button type="submit" className="btn btn-primary catering-submit">
          Continuer vers la réservation <span>→</span>
        </button>
      </form>
    </main>
  );
}

export default TraiteurPage;

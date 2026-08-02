import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/ReservationPage.css';
import { apiRequest } from './lib/api';

const halls = { Tanger: ['2026-06-01', '2026-06-10'], Casablanca: ['2026-07-05'], Rabat: [] };

function ReservationPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ city: '', date: '', paymentMethod: '', cardNumber: '', cardName: '', expiry: '', cvv: '' });
  const [availability, setAvailability] = useState('idle');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = ({ target }) => {
    setFormData((current) => ({ ...current, [target.name]: target.value }));
    if (target.name === 'city' || target.name === 'date') { setAvailability('idle'); setMessage(''); }
  };

  const checkAvailability = () => {
    if (!formData.city || !formData.date) { setAvailability('idle'); setMessage('Choisissez d’abord une ville et une date.'); return false; }
    const isUnavailable = (halls[formData.city] || []).includes(formData.date);
    setAvailability(isUnavailable ? 'unavailable' : 'available');
    setMessage(isUnavailable ? 'Cette date est déjà réservée. Choisissez une autre date.' : 'Excellente nouvelle : la salle est disponible pour cette date.');
    return !isUnavailable;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (availability !== 'available' && !checkAvailability()) return;
    setIsSubmitting(true);
    const traiteurSelection = localStorage.getItem('traiteurSelection');
    try {
      await apiRequest('/reservations', { method: 'POST', body: JSON.stringify({ ...formData, traiteurSelection: traiteurSelection ? JSON.parse(traiteurSelection) : null }) });
      localStorage.removeItem('traiteurSelection');
      localStorage.setItem('reservationStatus', 'confirmed');
      navigate('/notification');
    } catch (error) {
      console.error(error);
      localStorage.setItem('reservationStatus', 'local');
      localStorage.setItem('pendingReservation', JSON.stringify({ ...formData, traiteurSelection: traiteurSelection ? JSON.parse(traiteurSelection) : null }));
      navigate('/notification');
    } finally { setIsSubmitting(false); }
  };

  return (
    <main className="reservation-container">
      <header className="reservation-hero"><p className="eyebrow">ÉTAPE 2 · RÉSERVATION</p><h1>Votre moment<br />commence ici.</h1><p>Choisissez votre date, votre lieu et votre méthode de paiement.</p><div className="reservation-note"><span>✦</span> Confirmation claire, sans paiement en ligne simulé.</div></header>
      <form onSubmit={handleSubmit} className="reservation-box">
        <div className="reservation-heading"><span>01</span><div><h2>Les détails de votre événement</h2><p>Vérifiez la disponibilité avant de confirmer.</p></div></div>
        <div className="reservation-fields">
          <label className="field-label">Ville<select name="city" value={formData.city} onChange={handleChange} required><option value="">Choisir votre ville</option><option>Tanger</option><option>Casablanca</option><option>Rabat</option></select></label>
          <label className="field-label">Date souhaitée<input type="date" name="date" value={formData.date} onChange={handleChange} required /></label>
        </div>
        <button type="button" className="availability-button" onClick={checkAvailability}>Vérifier la disponibilité <span>→</span></button>
        {message && <div className={`availability-message ${availability}`} role="status"><span>{availability === 'available' ? '✓' : availability === 'unavailable' ? '!' : 'i'}</span>{message}</div>}
        <div className="reservation-heading payment-heading"><span>02</span><div><h2>Mode de paiement</h2><p>Choisissez la solution qui vous convient.</p></div></div>
        <label className="field-label">Méthode de paiement<select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} required><option value="">Sélectionner une méthode</option><option>Carte Bancaire</option><option>PayPal</option><option>Cash</option></select></label>
        {formData.paymentMethod === 'Carte Bancaire' && <p className="payment-safe">🔒 Les informations de carte ne sont pas enregistrées par EventRent.</p>}
        <button type="submit" className="btn btn-success reservation-submit" disabled={isSubmitting}>{isSubmitting ? 'Confirmation…' : 'Confirmer ma réservation'} <span>→</span></button>
      </form>
    </main>
  );
}

export default ReservationPage;

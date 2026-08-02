import React, { useState } from 'react';
import './styles/ContactPage.css';

function ContactPage() {
  const [isSent, setIsSent] = useState(false);
  const handleSubmit = (event) => { event.preventDefault(); setIsSent(true); };

  return (
    <main className="contact-container">
      <section className="contact-hero">
        <p className="eyebrow">PARLONS DE VOTRE PROJET</p>
        <h1>Une idée en tête ?<br />Créons-la ensemble.</h1>
        <p>Notre équipe vous accompagne dans chaque détail pour imaginer un événement qui vous ressemble.</p>
        <div className="contact-details">
          <div><span>✦</span><p><strong>Réponse rapide</strong><br />Notre équipe vous répond sous 24h.</p></div>
          <div><span>⌂</span><p><strong>Partout au Maroc</strong><br />Casablanca, Rabat, Tanger et plus.</p></div>
        </div>
      </section>

      <section className="contact-box">
        <p className="eyebrow">CONTACT</p>
        <h2>Parlez-nous de votre événement</h2>
        {isSent ? (
          <div className="contact-success" role="status"><span>✓</span><h3>Message envoyé</h3><p>Merci ! Notre équipe prendra contact avec vous très bientôt.</p><button className="btn btn-dark" onClick={() => setIsSent(false)}>Envoyer un autre message</button></div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="field-label">Nom complet<input type="text" className="form-control" placeholder="Votre nom" required /></label>
            <label className="field-label">Adresse e-mail<input type="email" className="form-control" placeholder="vous@exemple.com" required /></label>
            <label className="field-label">Votre message<textarea className="form-control" rows="5" placeholder="Dites-nous ce que vous imaginez…" required /></label>
            <button type="submit" className="btn btn-dark w-100">Envoyer le message <span>→</span></button>
          </form>
        )}
      </section>
    </main>
  );
}

export default ContactPage;

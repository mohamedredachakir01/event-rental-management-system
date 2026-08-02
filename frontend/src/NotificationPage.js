import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/NotificationPage.css';

function NotificationPage() {
  const navigate = useNavigate();
  const isLocal = localStorage.getItem('reservationStatus') === 'local';
  return (
    <main className="notif-container">
      <div className="celebration-orb orb-one" /><div className="celebration-orb orb-two" />
      <section className="notif-box">
        <div className="success-seal"><span>✓</span></div>
        <p className="eyebrow">EVENTRENT · RÉSERVATION</p>
        <h1>{isLocal ? 'Demande enregistrée' : 'Réservation confirmée'}</h1>
        <p className="notif-lead">{isLocal ? 'Vos choix sont conservés. Notre équipe confirmera votre réservation dès que le service sera disponible.' : 'Votre demande a été enregistrée avec succès. Notre équipe vous contactera pour les prochaines étapes.'}</p>
        <div className="notif-timeline"><div><span>1</span><p><strong>Demande reçue</strong><small>Vos informations sont bien enregistrées.</small></p></div><div><span>2</span><p><strong>Confirmation</strong><small>Notre équipe valide les derniers détails.</small></p></div><div><span>3</span><p><strong>Votre événement</strong><small>Il ne reste plus qu’à en profiter.</small></p></div></div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Retour à l’accueil <span>→</span></button>
      </section>
    </main>
  );
}
export default NotificationPage;

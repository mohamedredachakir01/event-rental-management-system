import React, { useCallback, useEffect, useState } from 'react';
import './styles/DashboardPage.css';
import { apiRequest } from './lib/api';
import { LoadingState, EmptyState } from './components/PageState';

const initialEventForm = {
  title: '',
  date: '',
  location: '',
  image: '',
};

function DashboardPage() {
  const [reservations, setReservations] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventForm, setEventForm] = useState(initialEventForm);
  const [editingEventId, setEditingEventId] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await apiRequest('/view/dashboard');
      const data = response.data || {};
      setReservations(Array.isArray(data.reservations) ? data.reservations : []);
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (error) {
      console.error(error);
      try {
        const fallbackEvents = await apiRequest('/events?limit=100');
        setEvents(Array.isArray(fallbackEvents) ? fallbackEvents : []);
        setReservations([]);
        setStatusMessage('Mode simplifié : les événements restent accessibles, mais les réservations ne sont pas disponibles pour le moment.');
      } catch {
        setStatusMessage('Les services du dashboard sont indisponibles. Vérifiez que les microservices sont démarrés.');
      }
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleEventChange = ({ target }) => {
    setEventForm((currentForm) => ({
      ...currentForm,
      [target.name]: target.value,
    }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setEventForm((currentForm) => ({
        ...currentForm,
        image: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const resetEventForm = () => {
    setEventForm(initialEventForm);
    setEditingEventId('');
  };

  const handleEventSubmit = async (event) => {
    event.preventDefault();

    try {
      const endpoint = editingEventId ? `/events/${editingEventId}` : '/events';
      const method = editingEventId ? 'PUT' : 'POST';

      await apiRequest(endpoint, {
        method,
        body: JSON.stringify(eventForm),
      });

      setStatusMessage(editingEventId ? 'Evenement modifie avec succes.' : 'Evenement ajoute avec succes.');
      resetEventForm();
      fetchDashboard();
    } catch (error) {
      console.error(error);
      setStatusMessage(error.message || 'Erreur serveur.');
    }
  };

  const handleEditEvent = (eventItem) => {
    setEditingEventId(eventItem._id);
    setEventForm({
      title: eventItem.title || '',
      date: eventItem.date || '',
      location: eventItem.location || '',
      image: eventItem.image || '',
    });
    setStatusMessage('Modification de l evenement en cours.');
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await apiRequest(`/events/${eventId}`, {
        method: 'DELETE',
      });

      setStatusMessage('Evenement supprime avec succes.');
      fetchDashboard();
    } catch (error) {
      console.error(error);
      setStatusMessage(error.message || 'Erreur serveur.');
    }
  };

  if (isLoading) return <LoadingState label="Chargement du tableau de bord…" />;

  const nextEvent = events[0];

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell container py-5">
        <div className="dashboard-header">
          <div>
            <p className="dashboard-kicker">Administration</p>
            <h2>Bonjour, Admin <span>✦</span></h2>
            <p className="dashboard-subtitle">
              Gérez vos événements et visualisez l’activité de votre plateforme depuis un seul espace.
            </p>
          </div>
          <div className="dashboard-date">EVENTRENT<br /><strong>ADMIN SPACE</strong></div>
        </div>

        <section className="dashboard-stats" aria-label="Résumé du dashboard">
          <article><span className="stat-icon">✦</span><p>Événements actifs<strong>{events.length}</strong></p></article>
          <article><span className="stat-icon">◌</span><p>Réservations<strong>{reservations.length}</strong></p></article>
          <article><span className="stat-icon">⌁</span><p>Prochain événement<strong>{nextEvent?.date || '—'}</strong></p></article>
        </section>

        {statusMessage && <p className="dashboard-status">{statusMessage}</p>}

        <section className="dashboard-panel dashboard-grid">
          <div className="event-form-card">
            <p className="panel-kicker">CATALOGUE</p>
            <h3>{editingEventId ? 'Modifier un événement' : 'Créer un événement'}</h3>
            <p className="panel-description">Ajoutez une expérience qui apparaîtra immédiatement sur la page d’accueil.</p>

            <form onSubmit={handleEventSubmit} className="event-form">
              <input
                type="text"
                name="title"
                className="form-control"
                placeholder="Titre de l’événement"
                value={eventForm.title}
                onChange={handleEventChange}
                required
              />

              <input
                type="date"
                name="date"
                className="form-control"
                value={eventForm.date}
                onChange={handleEventChange}
                required
              />

              <input
                type="text"
                name="location"
                className="form-control"
                placeholder="Ville ou lieu"
                value={eventForm.location}
                onChange={handleEventChange}
                required
              />

              <input
                type="url"
                name="image"
                className="form-control"
                placeholder="Lien de l’image (facultatif)"
                value={eventForm.image}
                onChange={handleEventChange}
              />

              <input type="file" className="form-control" accept="image/*" onChange={handleImageUpload} />

              {eventForm.image && (
                <img className="event-preview" src={eventForm.image} alt="Apercu de l evenement" />
              )}

              <div className="event-form-actions">
                <button type="submit" className="btn btn-dark">
                  {editingEventId ? 'Mettre à jour' : 'Publier l’événement'} <span>→</span>
                </button>

                {editingEventId && (
                  <button type="button" className="btn btn-outline-secondary" onClick={resetEventForm}>
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="events-list-card">
            <div className="events-title"><div><p className="panel-kicker">VOS EXPÉRIENCES</p><h3>Événements publiés</h3></div><span>{events.length} au total</span></div>

            <div className="events-grid">
              {events.map((eventItem) => (
                <article className="event-admin-card" key={eventItem._id}>
                  <img src={eventItem.image || 'https://via.placeholder.com/400x240'} alt={eventItem.title} />
                  <div className="event-admin-body">
                    <h4>{eventItem.title}</h4>
                    <p className="event-meta">⌖ {eventItem.location}</p>
                    <p className="event-meta">◷ {eventItem.date}</p>
                    <div className="event-admin-actions">
                      <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => handleEditEvent(eventItem)}>
                        Modifier
                      </button>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeleteEvent(eventItem._id)}>
                        Supprimer
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {events.length === 0 && <EmptyState title="Aucun événement" description="Ajoutez votre premier événement avec le formulaire." />}
          </div>
        </section>

        <section className="dashboard-panel mt-4">
          <div className="events-title"><div><p className="panel-kicker">SUIVI CLIENT</p><h3>Réservations récentes</h3></div><span>{reservations.length} au total</span></div>

          <div className="table-responsive">
            <table className="table table-bordered table-striped shadow-sm mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Email</th>
                  <th>Ville</th>
                  <th>Date</th>
                  <th>Invites</th>
                  <th>Paiement</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation, index) => (
                  <tr key={index}>
                    <td>{reservation.email || 'user@mail.com'}</td>
                    <td>{reservation.city}</td>
                    <td>{reservation.date}</td>
                    <td>{reservation.guests || reservation.traiteurSelection?.guests || 0}</td>
                    <td>{reservation.paymentMethod || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {reservations.length === 0 && <EmptyState title="Aucune réservation" description="Les réservations clients apparaîtront ici." />}
        </section>
      </div>
    </div>
  );
}

export default DashboardPage;

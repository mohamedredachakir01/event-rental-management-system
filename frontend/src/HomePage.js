import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/HomePage.css';
import { apiRequest } from './lib/api';
import { LoadingState, EmptyState } from './components/PageState';
const fallbackEvents = [
  {
    _id: 'local-1',
    title: 'Mariage Elegant',
    date: '2026-06-18',
    location: 'Casablanca',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
  },
  {
    _id: 'local-2',
    title: 'Anniversaire Luxe',
    date: '2026-07-08',
    location: 'Rabat',
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80',
  },
  {
    _id: 'local-3',
    title: 'Soiree Entreprise',
    date: '2026-08-21',
    location: 'Tanger',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80',
  },
];

function HomePage() {
  const [events, setEvents] = useState([]);
  const [eventsSource, setEventsSource] = useState('remote');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await apiRequest('/events?limit=12');

        if (Array.isArray(data) && data.length > 0) {
          setEvents(data);
          setEventsSource('remote');
          return;
        }

        setEvents(fallbackEvents);
        setEventsSource('fallback');
      } catch (error) {
        console.error(error);
        setEvents(fallbackEvents);
        setEventsSource('fallback');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleChoose = () => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    navigate('/traiteur');
  };

  return (
    <div className="home-page">
      <header className="hero-section text-center text-white">
        <h1>Organisez votre evenement parfait</h1>
        <p>Choisissez le service qui vous convient</p>
      </header>

      <main className="home-content container py-5">
        <h2 className="text-center mb-4">Nos evenements</h2>

        {eventsSource === 'fallback' && (
          <p className="text-center text-muted mb-4">
            Affichage des evenements par defaut.
          </p>
        )}

        {isLoading ? <LoadingState label="Chargement des événements…" /> : <div className="row">
          {events.map((event) => (
            <div className="col-md-4 mb-4" key={event._id || `${event.title}-${event.date}`}>
              <div className="card shadow h-100">
                <img
                  src={event.image || 'https://via.placeholder.com/300'}
                  className="card-img-top"
                  alt={event.title}
                />

                <div className="card-body">
                  <h5>{event.title}</h5>
                  <p>{event.location}</p>
                  <p>{event.date}</p>

                  <button className="btn btn-primary w-100" onClick={handleChoose}>
                    Choisir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>}
        {!isLoading && events.length === 0 && <EmptyState title="Aucun événement disponible" description="Revenez bientôt pour découvrir nos prochaines offres." />}
      </main>

      <footer className="home-footer bg-dark text-white text-center p-3">
        Copyright 2026 EventRent - Tous droits reserves
      </footer>
    </div>
  );
}

export default HomePage;

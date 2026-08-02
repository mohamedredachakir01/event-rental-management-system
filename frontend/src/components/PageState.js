export function LoadingState({ label = 'Chargement en cours…' }) {
  return <div className="container py-5 text-center" role="status"><div className="spinner-border text-primary" aria-hidden="true" /><p className="mt-3">{label}</p></div>;
}

export function EmptyState({ title, description }) {
  return <div className="alert alert-light border text-center py-4"><h3 className="h5">{title}</h3><p className="mb-0 text-muted">{description}</p></div>;
}

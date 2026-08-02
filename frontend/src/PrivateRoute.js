import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children, requireAdmin = false }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
}

export default PrivateRoute;

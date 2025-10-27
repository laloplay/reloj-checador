import React from 'react';
import { Card } from 'react-bootstrap';
import 'animate.css';

function PaginaEnConstruccion({ titulo }) {
  return (
    <div className="animate__animated animate__fadeIn" data-bs-theme="dark">
      <header className="pb-3 mb-4 border-bottom border-secondary">
        <h1 className="h3 text-white-50">{titulo}</h1>
      </header>
      <Card bg="dark" text="white" className="shadow-lg border-0" style={{ borderRadius: '1rem' }}>
        <Card.Body className="p-5 text-center">
          <i className="bi bi-tools display-3 text-warning"></i>
          <h2 className="mt-3">Página en Construcción</h2>
          <p className="lead text-white-50">Esta sección estará disponible próximamente. ¡Estamos trabajando en ello!</p>
        </Card.Body>
      </Card>
    </div>
  );
}

export default PaginaEnConstruccion;
// frontend/src/AdminLayout.jsx
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

function AdminLayout() {
  const location = useLocation();

  const getLinkClass = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link text-white';
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* ======================= BARRA LATERAL (SIDEBAR) ======================= */}
      <aside className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark" style={{ width: '280px' }}>
        <Link to="/admin" className="d-flex align-items-center mb-3 text-white text-decoration-none">
          <i className="bi bi-shield-lock-fill me-2 fs-4"></i>
          <span className="fs-4">PANEL ADMIN</span>
        </Link>
        <hr />
        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item mb-1">
            <Link to="/admin/nuevo-registro" className={getLinkClass('/admin/nuevo-registro')}>
              <i className="bi bi-person-plus-fill me-2"></i>
              Nuevo Empleadoooo
            </Link>
          </li>
          <li className="nav-item mb-1">
            <Link to="/admin/registros" className={getLinkClass('/admin/registros')}>
              <i className="bi bi-clipboard2-data-fill me-2"></i>
              Registros
            </Link>
          </li>
          <li className="nav-item mb-1">
            <Link to="/admin/puestos" className={getLinkClass('/admin/puestos')}>
              <i className="bi bi-briefcase-fill me-2"></i>
              Puestos y Salarios
            </Link>
          </li>
          <li className="nav-item mb-1">
            <Link to="/admin/sucursales" className={getLinkClass('/admin/sucursales')}>
              <i className="bi bi-shop me-2"></i>
              Sucursales
            </Link>
          </li>
          <li className="nav-item mb-1">
            <Link to="/admin/bonos" className={getLinkClass('/admin/bonos')}>
              <i className="bi bi-gift-fill me-2"></i>
              Bonos
            </Link>
          </li>
        </ul>
        <hr />
        <div>
          <a href="#" className="d-flex align-items-center text-white text-decoration-none">
            <i className="bi bi-box-arrow-left me-2"></i>
            <strong>Cerrar Sesión</strong>
          </a>
        </div>
      </aside>

      {/* ======================= CONTENIDO DINÁMICO ======================= */}
      <main className="w-100 p-4" style={{ overflowY: 'auto' }}>
        <Outlet /> {/* <-- Aquí se renderizará la página activa */}
      </main>
    </div>
  );
}

export default AdminLayout;
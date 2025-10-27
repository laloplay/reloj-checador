// frontend/src/AdminLayout.jsx
import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Offcanvas, Button, Nav } from 'react-bootstrap';

function AdminLayout() {
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  const handleClose = () => setShowMenu(false);
  const handleShow = () => setShowMenu(true);

  // La función de la clase se queda igual
  const getLinkClass = (path) => {
    return location.pathname.startsWith(path) && path !== '/admin' || location.pathname === path
      ? 'nav-link active bg-light text-primary' // Resaltado inverso
      : 'nav-link text-white-50';   // Texto gris claro sutil
  };

  // Ajustamos el 'getLinkClass' para la ruta raíz '/admin'
  const getDashboardLinkClass = (path) => {
    return location.pathname === path
      ? 'nav-link active bg-light text-primary'
      : 'nav-link text-white-50';
  }

  const SidebarContent = () => (
    <>
      <Link to="/admin" className="d-flex align-items-center mb-3 text-white text-decoration-none">
        {/* Usamos un color 'primary' para el ícono principal */}
        <i className="bi bi-person-workspace me-2 fs-4" style={{ color: '#0d6efd' }}></i> 
        <span className="fs-4">PANEL ADMIN</span>
      </Link>
      <hr />
      <Nav as="ul" variant="pills" className="flex-column mb-auto">
        
        {/* --- Menú con Iconos de Colores --- */}
        
        <Nav.Item as="li" className="nav-item mb-1">
          <Nav.Link as={Link} to="/admin" className={getDashboardLinkClass('/admin')} onClick={handleClose}>
            <i className="bi bi-speedometer2 me-2" style={{ color: '#0d6efd' }}></i> {/* Azul */}
            Dashboard
          </Nav.Link>
        </Nav.Item>
        <Nav.Item as="li" className="nav-item mb-1">
          <Nav.Link as={Link} to="/admin/nuevo-registro" className={getLinkClass('/admin/nuevo-registro')} onClick={handleClose}>
            <i className="bi bi-person-plus-fill me-2" style={{ color: '#198754' }}></i> {/* Verde */}
            Nuevo Empleado
          </Nav.Link>
        </Nav.Item>
        <Nav.Item as="li" className="nav-item mb-1">
          <Nav.Link as={Link} to="/admin/registros" className={getLinkClass('/admin/registros')} onClick={handleClose}>
            <i className="bi bi-clipboard2-data-fill me-2" style={{ color: '#0dcaf0' }}></i> {/* Cian (Info) */}
            Registros
          </Nav.Link>
        </Nav.Item>
        <Nav.Item as="li" className="nav-item mb-1">
          <Nav.Link as={Link} to="/admin/puestos" className={getLinkClass('/admin/puestos')} onClick={handleClose}>
            <i className="bi bi-briefcase-fill me-2" style={{ color: '#ffc107' }}></i> {/* Amarillo (Warning) */}
            Puestos y Salarios
          </Nav.Link>
        </Nav.Item>
        <Nav.Item as="li" className="nav-item mb-1">
          <Nav.Link as={Link} to="/admin/sucursales" className={getLinkClass('/admin/sucursales')} onClick={handleClose}>
            <i className="bi bi-shop me-2" style={{ color: '#fd7e14' }}></i> {/* Naranja */}
            Sucursales
          </Nav.Link>
        </Nav.Item>
        <Nav.Item as="li" className="mb-1">
          <Nav.Link as={Link} to="/admin/bonos" className={getLinkClass('/admin/bonos')} onClick={handleClose}>
            <i className="bi bi-gift-fill me-2" style={{ color: '#6f42c1' }}></i> {/* Morado (Indigo) */}
            Bonos
          </Nav.Link>
        </Nav.Item>
      </Nav>
      <hr />
      <div>
        <a 
          href="/login-admin" 
          className="d-flex align-items-center text-white-50 text-decoration-none"
          onClick={() => sessionStorage.removeItem('authToken')} // Cierra la sesión
        >
          <i className="bi bi-box-arrow-left me-2"></i>
          <strong>Cerrar Sesión</strong>
        </a>
      </div>
    </>
  );

  return (
    // Fondo de gradiente oscuro
    <div className="d-flex" style={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #2c3e50 0%, #1a202c 100%)' }}> 
      
      {/* Sidebar Fijo para Escritorio (bg-dark) */}
      <aside className="d-none d-lg-flex flex-column flex-shrink-0 p-3 text-white bg-dark" style={{ width: '280px' }}>
        <SidebarContent />
      </aside>

      {/* Botón de Hamburguesa para Móvil (bg-dark) */}
      <Button
        variant="dark"
        className="d-lg-none position-fixed top-0 start-0 m-3 shadow"
        onClick={handleShow}
        style={{ zIndex: 1050 }}
      >
        <i className="bi bi-list fs-4"></i>
      </Button>

      {/* Menú Offcanvas (bg-dark) */}
      <Offcanvas show={showMenu} onHide={handleClose} placement="start" className="text-white bg-dark">
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title>Menú</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column p-3">
          <SidebarContent />
        </Offcanvas.Body>
      </Offcanvas>

      {/* Contenido Principal */}
      <main className="w-100 p-4" style={{ overflowY: 'auto' }}>
        <div className="d-lg-none" style={{ height: '60px' }}></div>
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
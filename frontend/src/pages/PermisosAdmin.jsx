import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Alert, Spinner, Card, Form, ListGroup, Row, Col, Button } from 'react-bootstrap';
import 'animate.css';

function PermisosAdmin() {
  const [permisos, setPermisos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [listaSucursales, setListaSucursales] = useState([]);
  const [listaMotivos, setListaMotivos] = useState([]);
  
  const [filtroSucursal, setFiltroSucursal] = useState('TODAS');
  
  const [employeeId, setEmployeeId] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [motivoId, setMotivoId] = useState('');
  
  const [nuevoMotivoNombre, setNuevoMotivoNombre] = useState('');
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [permisosRes, sucursalesRes, empleadosRes, motivosRes] = await Promise.all([
        axios.get('/api/permisos', { params: { sucursal: filtroSucursal } }),
        axios.get('/api/sucursales'),
        axios.get('/api/employees', { params: { sucursal: filtroSucursal } }),
        axios.get('/api/motivos-permiso')
      ]);
      setPermisos(permisosRes.data);
      setListaSucursales(sucursalesRes.data);
      setEmpleados(empleadosRes.data);
      setListaMotivos(motivosRes.data);
    } catch (error) { 
      console.error("Error cargando datos", error); 
      setMessage({ type: 'danger', text: 'Error al cargar los datos.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchAllData(); 
  }, [filtroSucursal]);
  
  const fetchMotivos = async () => {
     try {
        const res = await axios.get('/api/motivos-permiso');
        setListaMotivos(res.data);
     } catch (error) {
        console.error("Error cargando motivos", error);
     }
  };

  const handlePermisoSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/permisos', { 
        employeeId: parseInt(employeeId, 10), 
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        motivoId: parseInt(motivoId, 10)
      });
      setMessage({ type: 'success', text: `Permiso registrado con éxito.` });
      setEmployeeId('');
      setFechaInicio('');
      setFechaFin('');
      setMotivoId('');
      fetchAllData();
    } catch (error) { 
      setMessage({ type: 'danger', text: `Error: ${error.response?.data?.error || 'No se pudo crear.'}` }); 
    }
  };

  const handlePermisoDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres borrar este permiso?')) {
      try {
        await axios.delete(`/api/permisos/${id}`);
        setMessage({ type: 'success', text: 'Registro borrado con éxito.' });
        fetchAllData();
      } catch (error) { 
        setMessage({ type: 'danger', text: 'Error al borrar el registro.' }); 
      }
    }
  };
  
  const handleMotivoSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/motivos-permiso', { nombre: nuevoMotivoNombre });
      setMessage({ type: 'success', text: 'Nuevo motivo creado.' });
      setNuevoMotivoNombre('');
      fetchMotivos();
    } catch (error) { 
      setMessage({ type: 'danger', text: `Error: ${error.response?.data?.error || 'No se pudo crear.'}` }); 
    }
  };

  const handleMotivoDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres borrar este motivo?')) {
      try {
        await axios.delete(`/api/motivos-permiso/${id}`);
        setMessage({ type: 'success', text: 'Motivo borrado.' });
        fetchMotivos();
      } catch (error) { 
        setMessage({ type: 'danger', text: 'Error al borrar. Asegúrate de que no esté en uso.' }); 
      }
    }
  };

  const formatFecha = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
    return new Date(dateString).toLocaleDateString('es-MX', options);
  };

  return (
    <div className="animate__animated animate__fadeIn" data-bs-theme="dark"> 
      <header className="pb-3 mb-4 border-bottom border-secondary d-flex justify-content-between align-items-center">
        <h1 className="h3 text-white-50">Gestión de Permisos</h1>
        <div style={{ maxWidth: '250px' }}>
          <Form.Select value={filtroSucursal} onChange={(e) => setFiltroSucursal(e.target.value)}>
            <option value="TODAS">Mostrar Todas las Sucursales</option>
            {listaSucursales.map(s => (
              <option key={s.id} value={s.nombre}>{s.nombre}</option>
            ))}
          </Form.Select>
        </div>
      </header>
      
      {message.text && (
        <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>
          {message.text}
        </Alert>
      )}
      
      <Row className="g-4">
        <Col lg={4}>
          <Card bg="dark" text="white" className="shadow-sm border-0 mb-4" style={{ borderRadius: '1rem' }}>
            <Card.Header className="bg-primary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
              <h5 className="mb-0"><i className="bi bi-calendar-plus-fill me-2"></i>Asignar Permiso</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handlePermisoSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Empleado</Form.Label>
                  <Form.Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
                    <option value="">Seleccionar empleado...</option>
                    {empleados.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Motivo del Permiso</Form.Label>
                  <Form.Select value={motivoId} onChange={(e) => setMotivoId(e.target.value)} required>
                    <option value="">Seleccionar motivo...</option>
                    {listaMotivos.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Row>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Fecha de Inicio</Form.Label>
                      <Form.Control type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Fecha de Fin</Form.Label>
                      <Form.Control type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} required />
                    </Form.Group>
                  </Col>
                </Row>
                <Button type="submit" variant="primary" className="w-100 shadow-sm">
                  <i className="bi bi-save-fill me-2"></i>Guardar Permiso
                </Button>
              </Form>
            </Card.Body>
          </Card>

          <Card bg="dark" text="white" className="shadow-sm border-0" style={{ borderRadius: '1rem' }}>
            <Card.Header className="bg-secondary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
              <h5 className="mb-0"><i className="bi bi-pencil-square me-2"></i>Gestionar Motivos</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleMotivoSubmit} className="mb-3">
                <Row>
                  <Col xs={8}>
                    <Form.Control type="text" value={nuevoMotivoNombre} onChange={e => setNuevoMotivoNombre(e.target.value.toUpperCase())} placeholder="Nuevo motivo (Ej: INCAPACIDAD)" required />
                  </Col>
                  <Col xs={4} className="d-grid">
                    <Button type="submit" variant="outline-success">Crear</Button>
                  </Col>
                </Row>
              </Form>
              <ListGroup>
                {listaMotivos.map(motivo => (
                  <ListGroup.Item key={motivo.id} className="bg-dark text-white d-flex justify-content-between align-items-center">
                    {motivo.nombre}
                    <Button variant="outline-danger" size="sm" onClick={() => handleMotivoDelete(motivo.id)}>
                      <i className="bi bi-trash3-fill"></i>
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>

        </Col>
        
        <Col lg={8}>
          <Card bg="dark" text="white" className="shadow-sm border-0" style={{ borderRadius: '1rem' }}>
             <Card.Header className="bg-primary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
              <h5 className="mb-0"><i className="bi bi-calendar-event-fill me-2"></i>Permisos Programados</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Empleado</th>
                      <th>Motivo</th>
                      <th>Desde</th>
                      <th>Hasta</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="5" className="text-center"><Spinner animation="border" /></td></tr>
                    ) : (
                      permisos.map(item => (
                        <tr key={item.id}>
                          <td className="fw-bold">{item.Empleado?.nombre || 'N/A'}</td>
                          <td><span className="badge bg-info">{item.MotivoPermiso?.nombre || 'N/A'}</span></td>
                          <td>{formatFecha(item.fecha_inicio)}</td>
                          <td>{formatFecha(item.fecha_fin)}</td>
                          <td className="text-end">
                            <Button variant="outline-danger" size="sm" onClick={() => handlePermisoDelete(item.id)}>
                              <i className="bi bi-trash3-fill"></i>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default PermisosAdmin;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Alert, Spinner, Card, Form, ListGroup, Row, Col, Button } from 'react-bootstrap';
import 'animate.css';

function VacacionesAdmin() {
  const [items, setItems] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [listaSucursales, setListaSucursales] = useState([]);
  
  const [filtroSucursal, setFiltroSucursal] = useState('TODAS');
  
  const [employeeId, setEmployeeId] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [vacacionesRes, sucursalesRes, empleadosRes] = await Promise.all([
        axios.get('/api/vacaciones', { params: { sucursal: filtroSucursal } }),
        axios.get('/api/sucursales'),
        axios.get('/api/employees', { params: { sucursal: filtroSucursal } })
      ]);
      setItems(vacacionesRes.data);
      setListaSucursales(sucursalesRes.data);
      setEmpleados(empleadosRes.data);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/vacaciones', { 
        employeeId: parseInt(employeeId, 10), 
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      });
      setMessage({ type: 'success', text: `Vacaciones registradas con éxito.` });
      setEmployeeId('');
      setFechaInicio('');
      setFechaFin('');
      fetchAllData();
    } catch (error) { 
      setMessage({ type: 'danger', text: `Error: ${error.response?.data?.error || 'No se pudo crear.'}` }); 
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres borrar este registro de vacaciones?')) {
      try {
        await axios.delete(`/api/vacaciones/${id}`);
        setMessage({ type: 'success', text: 'Registro borrado con éxito.' });
        fetchAllData();
      } catch (error) { 
        setMessage({ type: 'danger', text: 'Error al borrar el registro.' }); 
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
        <h1 className="h3 text-white-50">Gestión de Vacaciones</h1>
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
          <Card bg="dark" text="white" className="shadow-sm border-0" style={{ borderRadius: '1rem' }}>
            <Card.Header className="bg-primary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
              <h5 className="mb-0"><i className="bi bi-plus-circle-fill me-2"></i>Registrar Vacaciones</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
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
                  <Form.Label>Fecha de Inicio</Form.Label>
                  <Form.Control type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Fin</Form.Label>
                  <Form.Control type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} required />
                </Form.Group>
                <Button type="submit" variant="primary" className="w-100 shadow-sm">
                  <i className="bi bi-save-fill me-2"></i>Guardar Vacaciones
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={8}>
          <Card bg="dark" text="white" className="shadow-sm border-0" style={{ borderRadius: '1rem' }}>
             <Card.Header className="bg-primary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
              <h5 className="mb-0"><i className="bi bi-airplane-fill me-2"></i>Vacaciones Programadas</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Empleado</th>
                      <th>Desde</th>
                      <th>Hasta</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="4" className="text-center"><Spinner animation="border" /></td></tr>
                    ) : (
                      items.map(item => (
                        <tr key={item.id}>
                          <td className="fw-bold">{item.Empleado?.nombre || 'N/A'}</td>
                          <td>{formatFecha(item.fecha_inicio)}</td>
                          <td>{formatFecha(item.fecha_fin)}</td>
                          <td className="text-end">
                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id)}>
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

export default VacacionesAdmin;
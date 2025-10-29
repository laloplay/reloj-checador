import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Alert, Spinner, Card, Form, ListGroup, Row, Col, Button, Tab, Nav } from 'react-bootstrap';
import 'animate.css';

function IncidentesNomina() {
  const [empleados, setEmpleados] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [comisiones, setComisiones] = useState([]);
  const [deducciones, setDeducciones] = useState([]);
  
  const [filtroSucursal, setFiltroSucursal] = useState('TODAS');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const [formComision, setFormComision] = useState({ employeeId: '', monto: '', mes: '', fecha_pago: '' });
  const [formDeduccion, setFormDeduccion] = useState({ employeeId: '', monto: '', motivo: '', fecha_pago: '' });

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [sucursalesRes, empleadosRes, comisionesRes, deduccionesRes] = await Promise.all([
        axios.get('/api/sucursales'),
        axios.get('/api/employees', { params: { sucursal: filtroSucursal } }),
        axios.get('/api/incidencias/comisiones'),
        axios.get('/api/incidencias/deducciones')
      ]);
      setSucursales(sucursalesRes.data);
      setEmpleados(empleadosRes.data);
      setComisiones(comisionesRes.data);
      setDeducciones(deduccionesRes.data);
    } catch (error) { 
      console.error("Error cargando datos", error); 
      setMessage({ type: 'danger', text: 'Error al cargar los datos.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, [filtroSucursal]);

  const handleFormChange = (e, setForm) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleComisionSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/incidencias/comisiones', formComision);
      setMessage({ type: 'success', text: 'Comisión agregada con éxito.' });
      setFormComision({ employeeId: '', monto: '', mes: '', fecha_pago: '' });
      fetchAllData();
    } catch (error) {
      setMessage({ type: 'danger', text: 'Error al guardar la comisión.' });
    }
  };

  const handleDeduccionSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/incidencias/deducciones', formDeduccion);
      setMessage({ type: 'success', text: 'Deducción agregada con éxito.' });
      setFormDeduccion({ employeeId: '', monto: '', motivo: '', fecha_pago: '' });
      fetchAllData();
    } catch (error) {
      setMessage({ type: 'danger', text: 'Error al guardar la deducción.' });
    }
  };

  const handleComisionDelete = async (id) => {
    if (window.confirm('¿Borrar esta comisión?')) {
      try {
        await axios.delete(`/api/incidencias/comisiones/${id}`);
        setMessage({ type: 'success', text: 'Comisión borrada.' });
        fetchAllData();
      } catch (error) { setMessage({ type: 'danger', text: 'Error al borrar.' }); }
    }
  };

  const handleDeduccionDelete = async (id) => {
     if (window.confirm('¿Borrar esta deducción?')) {
      try {
        await axios.delete(`/api/incidencias/deducciones/${id}`);
        setMessage({ type: 'success', text: 'Deducción borrada.' });
        fetchAllData();
      } catch (error) { setMessage({ type: 'danger', text: 'Error al borrar.' }); }
    }
  };
  
  const formatFecha = (dateString) => new Date(dateString).toLocaleDateString('es-MX', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="animate__animated animate__fadeIn" data-bs-theme="dark">
      <header className="pb-3 mb-4 border-bottom border-secondary d-flex justify-content-between align-items-center">
        <h1 className="h3 text-white-50">Percepciones y Deducciones</h1>
        <div style={{ maxWidth: '250px' }}>
          <Form.Select value={filtroSucursal} onChange={(e) => setFiltroSucursal(e.target.value)}>
            <option value="TODAS">Todas las Sucursales</option>
            {sucursales.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
          </Form.Select>
        </div>
      </header>
      
      {message.text && (<Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>{message.text}</Alert>)}
      
      <Tab.Container defaultActiveKey="comisiones">
        <Row className="g-4">
          <Col lg={4}>
            <Card bg="dark" text="white" className="shadow-sm border-0 mb-4" style={{ borderRadius: '1rem' }}>
              <Card.Header className="bg-primary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
                <Nav variant="pills" className="nav-tabs-custom-pill">
                  <Nav.Item><Nav.Link eventKey="comisiones"><i className="bi bi-plus-circle-fill me-2"></i>Comisión</Nav.Link></Nav.Item>
                  <Nav.Item><Nav.Link eventKey="deducciones"><i className="bi bi-dash-circle-fill me-2"></i>Deducción</Nav.Link></Nav.Item>
                </Nav>
              </Card.Header>
              <Card.Body className="p-4">
                <Tab.Content>
                  <Tab.Pane eventKey="comisiones">
                    <Form onSubmit={handleComisionSubmit}>
                      <Form.Group className="mb-3"><Form.Label>Empleado</Form.Label><Form.Select name="employeeId" value={formComision.employeeId} onChange={(e) => handleFormChange(e, setFormComision)} required><option value="">Seleccionar...</option>{empleados.map(emp => (<option key={emp.id} value={emp.id}>{emp.nombre}</option>))}</Form.Select></Form.Group>
                      <Form.Group className="mb-3"><Form.Label>Monto</Form.Label><Form.Control type="number" step="0.01" name="monto" value={formComision.monto} onChange={(e) => handleFormChange(e, setFormComision)} required /></Form.Group>
                      <Form.Group className="mb-3"><Form.Label>Mes de Comisión</Form.Label><Form.Control type="text" name="mes" value={formComision.mes} onChange={(e) => handleFormChange(e, setFormComision)} placeholder="Ej: OCTUBRE 2025" required /></Form.Group>
                      <Form.Group className="mb-3"><Form.Label>Fecha de Aplicación (Quincena)</Form.Label><Form.Control type="date" name="fecha_pago" value={formComision.fecha_pago} onChange={(e) => handleFormChange(e, setFormComision)} required /></Form.Group>
                      <Button type="submit" variant="primary" className="w-100">Guardar Comisión</Button>
                    </Form>
                  </Tab.Pane>
                  <Tab.Pane eventKey="deducciones">
                    <Form onSubmit={handleDeduccionSubmit}>
                      <Form.Group className="mb-3"><Form.Label>Empleado</Form.Label><Form.Select name="employeeId" value={formDeduccion.employeeId} onChange={(e) => handleFormChange(e, setFormDeduccion)} required><option value="">Seleccionar...</option>{empleados.map(emp => (<option key={emp.id} value={emp.id}>{emp.nombre}</option>))}</Form.Select></Form.Group>
                      <Form.Group className="mb-3"><Form.Label>Monto</Form.Label><Form.Control type="number" step="0.01" name="monto" value={formDeduccion.monto} onChange={(e) => handleFormChange(e, setFormDeduccion)} required /></Form.Group>
                      <Form.Group className="mb-3"><Form.Label>Motivo</Form.Label><Form.Control type="text" name="motivo" value={formDeduccion.motivo} onChange={(e) => handleFormChange(e, setFormDeduccion)} placeholder="Ej: PRÉSTAMO" required /></Form.Group>
                      <Form.Group className="mb-3"><Form.Label>Fecha de Aplicación (Quincena)</Form.Label><Form.Control type="date" name="fecha_pago" value={formDeduccion.fecha_pago} onChange={(e) => handleFormChange(e, setFormDeduccion)} required /></Form.Group>
                      <Button type="submit" variant="danger" className="w-100">Guardar Deducción</Button>
                    </Form>
                  </Tab.Pane>
                </Tab.Content>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={8}>
            <Tab.Content>
              <Tab.Pane eventKey="comisiones">
                <Card bg="dark" text="white" className="shadow-sm border-0" style={{ borderRadius: '1rem' }}>
                  <Card.Header className="bg-dark text-white-50 border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}><h5 className="mb-0">Comisiones Programadas</h5></Card.Header>
                  <Card.Body className="p-0">
                    <ListGroup variant="flush">
                      {loading ? <div className="text-center p-3"><Spinner size="sm" /></div> : comisiones.map((item, index) => (
                        <ListGroup.Item key={item.id} className="bg-dark text-white d-flex justify-content-between align-items-center p-3" style={ index === 0 ? { borderTop: 'none' } : {}}>
                          <div>
                            <span className="fw-bold text-success">${item.monto}</span> <span className="text-white-50">para</span> {item.Empleado?.nombre || 'N/A'}
                            <br/><small className="text-white-50">{item.mes} (Aplicar en: {formatFecha(item.fecha_pago)})</small>
                          </div>
                          <Button variant="outline-danger" size="sm" onClick={() => handleComisionDelete(item.id)}><i className="bi bi-trash3-fill"></i></Button>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="deducciones">
                <Card bg="dark" text="white" className="shadow-sm border-0" style={{ borderRadius: '1rem' }}>
                  <Card.Header className="bg-dark text-white-50 border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}><h5 className="mb-0">Deducciones Programadas</h5></Card.Header>
                  <Card.Body className="p-0">
                    <ListGroup variant="flush">
                      {loading ? <div className="text-center p-3"><Spinner size="sm" /></div> : deducciones.map((item, index) => (
                        <ListGroup.Item key={item.id} className="bg-dark text-white d-flex justify-content-between align-items-center p-3" style={ index === 0 ? { borderTop: 'none' } : {}}>
                          <div>
                            <span className="fw-bold text-danger">-${item.monto}</span> <span className="text-white-50">para</span> {item.Empleado?.nombre || 'N/A'}
                            <br/><small className="text-white-50">{item.motivo} (Aplicar en: {formatFecha(item.fecha_pago)})</small>
                          </div>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDeduccionDelete(item.id)}><i className="bi bi-trash3-fill"></i></Button>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </div>
  );
}

export default IncidentesNomina;
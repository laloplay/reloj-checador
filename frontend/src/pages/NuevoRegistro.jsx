// frontend/src/pages/NuevoRegistro.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import { Spinner, Alert, Card, Button, Form, Row, Col } from 'react-bootstrap';
import 'animate.css';

function NuevoRegistro() {
  const [nombre, setNombre] = useState('');
  const [sucursal, setSucursal] = useState('');
  const [puestoId, setPuestoId] = useState('');
  const [salario, setSalario] = useState(0);
  const [bonoId, setBonoId] = useState('');
  const [bono, setBono] = useState(0);
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [horaEntrada, setHoraEntrada] = useState('');
  const [horaSalida, setHoraSalida] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);

  const [listaPuestos, setListaPuestos] = useState([]);
  const [listaSucursales, setListaSucursales] = useState([]);
  const [listaBonos, setListaBonos] = useState([]);

  const [message, setMessage] = useState({ type: '', text: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const webcamRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [puestosRes, sucursalesRes, bonosRes] = await Promise.all([
          axios.get('/api/puestos'),
          axios.get('/api/sucursales'),
          axios.get('/api/bonos')
        ]);
        setListaPuestos(puestosRes.data);
        setListaSucursales(sucursalesRes.data);
        setListaBonos(bonosRes.data);
      } catch (error) {
        setMessage({ type: 'danger', text: 'Error al cargar datos. Revisa la conexión.' });
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);
  
  // --- Lógica de handlers (sin cambios) ---
  const handlePuestoChange = (e) => { /* ... (sin cambios) ... */ };
  const handleBonoChange = (e) => { /* ... (sin cambios) ... */ };
  const capturePhoto = useCallback(() => { /* ... (sin cambios) ... */ }, [webcamRef]);
  const handleRegisterEmployee = async (e) => { /* ... (lógica sin cambios) ... */ };

  return (
    // IMPORTANTE: data-bs-theme="dark" para que los formularios se vean bien
    <div className="animate__animated animate__fadeIn" data-bs-theme="dark"> 
      <header className="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom border-secondary">
        <h1 className="h3 text-white-50">Nuevo Registro de Empleado</h1>
      </header>

      {message.text && (
        <Alert variant={message.type} className="d-flex align-items-center">
          {message.type === 'success' && <i className="bi bi-check-circle-fill me-2"></i>}
          {message.type === 'danger' && <i className="bi bi-exclamation-triangle-fill me-2"></i>}
          {message.type === 'info' && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />}
          {message.text}
        </Alert>
      )}

      <Form onSubmit={handleRegisterEmployee}>
        <Row className="g-4">
          <Col lg={7}>
            <Card bg="dark" text="white" className="h-100 shadow-sm border-0" style={{ borderRadius: '1rem' }}>
              <Card.Header className="bg-primary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
                <h5 className="mb-0"><i className="bi bi-file-earmark-text-fill me-2"></i>Datos Personales y Laborales</h5>
              </Card.Header>
              <Card.Body className="p-4">
                <Form.Group className="mb-3">
                  <Form.Label>Nombre Completo</Form.Label>
                  <Form.Control type="text" value={nombre} onChange={e => setNombre(e.target.value.toUpperCase())} required />
                </Form.Group>
                
                <Row className="mb-3">
                  <Form.Group as={Col} xs={12} md={6} className="mb-3 mb-md-0">
                    <Form.Label>Sucursal</Form.Label>
                    <Form.Select value={sucursal} onChange={e => setSucursal(e.target.value)} required>
                      <option value="">Seleccione...</option>
                      {listaSucursales.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group as={Col} xs={12} md={6}>
                    <Form.Label>Puesto</Form.Label>
                    <Form.Select value={puestoId} onChange={handlePuestoChange} required>
                      <option value="">Seleccione...</option>
                      {listaPuestos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Row>
                
                <Row className="mb-3">
                  <Form.Group as={Col} xs={12} md={6} className="mb-3 mb-md-0">
                    <Form.Label>Salario Diario</Form.Label>
                    <Form.Control type="text" value={`$${parseFloat(salario).toFixed(2)}`} readOnly disabled />
                  </Form.Group>
                  <Form.Group as={Col} xs={12} md={6}>
                    <Form.Label>Bono (Opcional)</Form.Label>
                    <Form.Select value={bonoId} onChange={handleBonoChange}>
                      <option value="">Ninguno</option>
                      {listaBonos.map(b => <option key={b.id} value={b.id}>{`${b.nombre} ($${parseFloat(b.monto).toFixed(2)})`}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Row>
                
                <Row className="mb-3">
                  <Form.Group as={Col} xs={12} md={4} className="mb-3 mb-md-0">
                    <Form.Label>Fecha de Ingreso</Form.Label>
                    <Form.Control type="date" value={fechaIngreso} onChange={e => setFechaIngreso(e.target.value)} />
                  </Form.Group>
                  <Form.Group as={Col} xs={12} md={4} className="mb-3 mb-md-0">
                    <Form.Label>Hora de Entrada</Form.Label>
                    <Form.Control type="time" value={horaEntrada} onChange={e => setHoraEntrada(e.target.value)} />
                  </Form.Group>
                  <Form.Group as={Col} xs={12} md={4}>
                    <Form.Label>Hora de Salida</Form.Label>
                    <Form.Control type="time" value={horaSalida} onChange={e => setHoraSalida(e.target.value)} />
                  </Form.Group>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={5}>
            <Card bg="dark" text="white" className="h-100 shadow-sm border-0" style={{ borderRadius: '1rem' }}>
              <Card.Header className="bg-primary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
                <h5 className="mb-0"><i className="bi bi-person-vcard-fill me-2"></i>Registro Facial</h5>
              </Card.Header>
              <Card.Body className="text-center d-flex flex-column">
                <div className="webcam-container bg-black rounded-3 mb-3 flex-grow-1 d-flex align-items-center justify-content-center" style={{minHeight: '250px'}}>
                  {capturedImage ? (
                    <img src={capturedImage} alt="Foto capturada" className="img-fluid rounded-3" />
                  ) : (
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="img-fluid rounded-3"
                    />
                  )}
                </div>
                <div className="btn-group w-100">
                  <Button variant="outline-primary" onClick={capturePhoto}>
                    <i className="bi bi-camera-fill me-1"></i> Tomar Foto
                  </Button>
                  <Button variant="outline-warning" onClick={() => setCapturedImage(null)}>
                    <i className="bi bi-arrow-repeat me-1"></i> Repetir
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <div className="col-12 mt-4">
              <Button type="submit" variant="primary" size="lg" className="w-100 shadow-sm" disabled={isRegistering}>
                {isRegistering ? (
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                ) : (
                  <><i className="bi bi-save-fill me-2"></i> Registrar Empleado</>
                )}
              </Button>
          </div>
        </Row>
      </Form>
    </div>
  );
}

export default NuevoRegistro;
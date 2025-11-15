import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import Webcam from 'react-webcam';
import { Link } from 'react-router-dom';
import { Spinner, Alert, Card, Button, Form, Row, Col, Modal, Table } from 'react-bootstrap';
import io from 'socket.io-client';
import 'animate.css';

const socket = io();

const getToday = () => new Date().toISOString().split('T')[0];

const getDefaultStartDate = () => {
  const today = new Date();
  const last15 = new Date(today.setDate(today.getDate() - 14));
  return last15.toISOString().split('T')[0];
};

function Kiosk() {
  const [status, setStatus] = useState('initializing');
  const [fingerprint, setFingerprint] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const webcamRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState({ variant: 'info', text: '', icon: '' });
  const [dateTime, setDateTime] = useState(new Date());

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [sucursalNombre, setSucursalNombre] = useState('');
  const [empleadosSucursal, setEmpleadosSucursal] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [filtroInicio, setFiltroInicio] = useState(getDefaultStartDate());
  const [filtroFin, setFiltroFin] = useState(getToday());
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);

  const capture = useCallback(async (type) => {
    setLoading(true);
    setCheckInMessage({ variant: 'info', text: '', icon: '' });
    const imageSrc = webcamRef.current?.getScreenshot();
    const timestamp = new Date().toISOString();

    if (!imageSrc) {
      setCheckInMessage({ variant: 'warning', text: 'No se pudo capturar la imagen.', icon: 'bi-exclamation-triangle-fill' });
      setLoading(false);
      return;
    }
    try {
      const response = await axios.post('/api/attendance/check-in', {
        image: imageSrc,
        fingerprint: fingerprint,
        type: type,
        timestamp: timestamp
      });

      const employeeName = response.data.employeeName || 'Empleado';
      const registrationType = response.data.type === 'ENTRADA' ? 'Entrada' : 'Salida';
      const statusRegistro = response.data.status;

      if (statusRegistro === 'RETARDO') {
        setCheckInMessage({ variant: 'warning', text: `¡Registro con RETARDO, ${employeeName}!`, icon: 'bi-alarm-fill' });
      } else {
        setCheckInMessage({ variant: 'success', text: `¡${registrationType} registrada, ${employeeName}!`, icon: 'bi-check-circle-fill' });
      }

    } catch (error) {
      console.error('Error en el check-in:', error);
      const errorMsg = error.response?.data?.message || 'Error de conexión.';
      setCheckInMessage({ variant: 'danger', text: `❌ ${errorMsg}`, icon: 'bi-x-circle-fill' });
    } finally {
      setLoading(false);
      setTimeout(() => setCheckInMessage({ variant: 'info', text: '', icon: '' }), 7000);
    }
  }, [webcamRef, fingerprint]);

  useEffect(() => {
    const getFingerprintAndVerify = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const deviceFingerprint = result.visitorId;
        setFingerprint(deviceFingerprint);

        const response = await axios.post('/api/devices/verify', { fingerprint: deviceFingerprint });

        setStatus(response.data.status);
        if (response.data.isAuthorized) {
          setSucursalNombre(response.data.sucursalNombre);
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setStatus('naming');
        } else {
          console.error('Error verificando el dispositivo:', error);
          setStatus('error');
        }
      }
    };
    getFingerprintAndVerify();

    const timerId = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timerId);

  }, []);

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    if (!deviceName) return;
    setLoading(true);
    try {
      await axios.post('/api/devices/register', {
        fingerprint: fingerprint,
        nombre: deviceName
      });
      setStatus('pending');
    } catch (error) {
      console.error("Error al registrar el nombre:", error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleShowReport = async () => {
    setShowReportModal(true);
    setLoadingReport(true);
    setCheckInMessage({ type: '', text: '', icon: '' });
    setReportData([]);
    setSelectedEmployeeId('');
    setEmpleadoSeleccionado(null);
    setFiltroInicio(getDefaultStartDate());
    setFiltroFin(getToday());
    try {
      const response = await axios.get('/api/employees', {
        params: { sucursal: sucursalNombre }
      });
      setEmpleadosSucursal(response.data);
    } catch (error) {
      console.error("Error cargando empleados de sucursal:", error);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleGenerateReportKiosk = async (e) => {
    if (e) e.preventDefault();
    if (!selectedEmployeeId) {
      return;
    }
    setLoadingReport(true);
    setReportData([]);
    const emp = empleadosSucursal.find(e => e.id === parseInt(selectedEmployeeId));
    setEmpleadoSeleccionado(emp);

    try {
      const response = await axios.get('/api/registros', {
        params: {
          employeeId: selectedEmployeeId,
          startDate: filtroInicio,
          endDate: filtroFin
        }
      });
      setReportData(response.data.reporte);
    } catch (error) {
      console.error("Error generando reporte:", error);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (showReportModal && selectedEmployeeId) {
      handleGenerateReportKiosk();
    }
  }, [selectedEmployeeId, filtroInicio, filtroFin, showReportModal]);

  const formatFecha = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    const options = {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      timeZone: 'UTC'
    };
    let formatted = new Date(date).toLocaleDateString('es-MX', options);
    return formatted.replace('.', '').replace(',', '');
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'LABORADO': return 'text-success fw-bold';
      case 'FALTA': return 'text-danger fw-bold';
      case 'FEST': return 'text-info';
      case 'VAC': return 'text-warning';
      case 'PERM': return 'text-warning';
      case 'DESC': return 'text-secondary';
      default: return 'text-warning';
    }
  };

  const renderStatus = (icon, color, title, text, code = null) => (
    <Card bg="dark" text="white" className="text-center shadow-lg border-0 mx-auto animate__animated animate__fadeIn" style={{ maxWidth: '480px', borderRadius: '1rem' }}>
      <Card.Body className="p-5">
        <i className={`bi ${icon} display-3 mb-4 text-${color}`}></i>
        <Card.Title as="h2" className="mb-3 fw-bold">{title}</Card.Title>
        <Card.Text className="text-white-50 fs-5">{text}</Card.Text>
        {code && <p className="mt-4 bg-secondary bg-opacity-10 p-3 rounded text-white-50 font-monospace"><small>Código: {code}</small></p>}
      </Card.Body>
    </Card>
  );

  const renderApproved = () => {
    const date = dateTime.toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const time = dateTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return (
      <Card bg="dark" text="white" className="shadow-lg border-0 col-11 col-md-10 col-lg-9 col-xl-8 mx-auto animate__animated animate__fadeIn" style={{ borderRadius: '1rem', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}>
        <Card.Body className="p-4 p-md-5">
          <div className="row g-4 g-lg-5 align-items-center">

            <div className="col-md-6 text-center">
              <h2 className="h4 mb-3 d-md-none text-muted fw-light">Reloj Checador</h2>
              <div className="ratio ratio-4x3 rounded-4 overflow-hidden shadow-inner bg-black mx-auto">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="position-absolute top-0 start-0 w-100 h-100"
                  videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
                  mirrored={true}
                />
              </div>
            </div>

            <div className="col-md-6 text-center">
              <h1 className="h5 text-muted fw-light mb-3 d-none d-md-block">Control de Asistencia</h1>
              <p className="lead fs-6 mb-1 text-white-50">{date}</p>
              <p className="display-5 fw-bold text-primary mb-4">{time}</p>

              <Row className="g-2">
                <Col xs={6}>
                  <Button
                    variant="success"
                    size="lg"
                    className="w-100 d-flex align-items-center justify-content-center py-3 fs-5 shadow-sm rounded-pill"
                    onClick={() => capture('ENTRADA')}
                    disabled={loading}
                    style={{ transition: 'all 0.2s ease-in-out' }}
                  >
                    {loading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <><i className="bi bi-box-arrow-in-right me-2 fs-4"></i> ENTRADA</>
                    )}
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button
                    variant="danger"
                    size="lg"
                    className="w-100 d-flex align-items-center justify-content-center py-3 fs-5 shadow-sm rounded-pill"
                    onClick={() => capture('SALIDA')}
                    disabled={loading}
                    style={{ transition: 'all 0.2s ease-in-out' }}
                  >
                    {loading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <><i className="bi bi-box-arrow-left me-2 fs-4"></i> SALIDA</>
                    )}
                  </Button>
                </Col>
              </Row>

              <div className="mt-3" style={{ minHeight: '60px' }}>
                {checkInMessage.text && (
                  <Alert variant={checkInMessage.variant} className="py-2 mb-0 small rounded-pill d-flex align-items-center justify-content-center animate__animated animate__fadeInUp">
                    <i className={`bi ${checkInMessage.icon} me-2 fs-5`}></i>
                    <span className="fw-bold">{checkInMessage.text}</span>
                  </Alert>
                )}
              </div>

              <Button
                size="sm"
                className="mt-3 rounded-pill fw-bold text-dark"
                onClick={handleShowReport}
                disabled={loading}
                style={{
                  backgroundColor: '#ffcc00', // Amarillo brillante tipo check engine
                  border: 'none',
                  boxShadow: '0 0 12px rgba(255, 204, 0, 0.6)',
                  transition: 'all 0.2s ease-in-out'
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#ffaa00'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = '#ffcc00'}
              >
                <i className="bi bi-list-check me-2"></i>Ver Registros ({sucursalNombre})
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  };

  const renderNamingForm = () => (
    <Card bg="dark" text="white" className="text-center shadow-lg border-0 mx-auto animate__animated animate__fadeIn" style={{ maxWidth: '480px', borderRadius: '1rem' }}>
      <Card.Body className="p-5">
        <i className="bi bi-input-cursor-text display-3 mb-4 text-primary"></i>
        <Card.Title as="h2" className="mb-3 fw-bold">Dispositivo Nuevo</Card.Title>
        <Card.Text className="text-white-50 fs-5">
          Asigna un nombre a este dispositivo (ej. "TABLET ENTRADA" o "MAQUINA 1").
        </Card.Text>
        <Form onSubmit={handleNameSubmit} className="mt-4" data-bs-theme="dark">
          <Form.Group>
            <Form.Control
              type="text"
              placeholder="Nombre del dispositivo"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value.toUpperCase())}
              required
              className="text-center fs-5"
            />
          </Form.Group>
          <Button type="submit" variant="primary" className="w-100 mt-3" disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : 'Solicitar Aprobación'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );

  const renderContent = () => {
    switch (status) {
      case 'initializing':
        return renderStatus('bi-arrow-repeat', 'primary', 'Inicializando...', 'Contactando al servidor...');
      case 'naming':
        return renderNamingForm();
      case 'pending':
        return renderStatus('bi-hourglass-split', 'warning', 'Solicitud Enviada', 'Un administrador debe autorizar este equipo.', fingerprint);
      case 'approved':
        return renderApproved();
      case 'rejected':
        return renderStatus('bi-x-octagon-fill', 'danger', 'Solicitud Rechazada', 'Este equipo no tiene permiso.');
      default:
        return renderStatus('bi-wifi-off', 'danger', 'Error de Conexión', 'No se pudo verificar el estado.');
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-3" style={{ background: 'radial-gradient(circle at center, #2c3e50 0%, #1a202c 100%)' }}>
      {renderContent()}

      <footer className="mt-4 text-center">
        <Link to="/login-admin" className="text-white-50 text-decoration-none fw-light" style={{ fontSize: '0.8rem', opacity: 0.5, transition: 'opacity 0.3s ease' }} onMouseOver={e => e.currentTarget.style.opacity = 1} onMouseOut={e => e.currentTarget.style.opacity = 0.5}>
          © {new Date().getFullYear()} UnifamCheck
        </Link>
      </footer>

      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} size="lg" centered data-bs-theme="dark">
        <Modal.Header className="bg-dark text-white-50" closeButton>
          <Modal.Title>
            Reporte de Asistencia ({sucursalNombre})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">

          <Form onSubmit={handleGenerateReportKiosk}>
            <Row className="g-3 mb-3 no-print">
              <Col md={5}>
                <Form.Group>
                  <Form.Label>Empleado</Form.Label>
                  <Form.Select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} required disabled={loadingReport}>
                    <option value="">Seleccionar empleado...</option>
                    {empleadosSucursal.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Fecha Inicio</Form.Label>
                  <Form.Control type="date" value={filtroInicio} onChange={(e) => setFiltroInicio(e.target.value)} required />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Fecha Fin</Form.Label>
                  <Form.Control type="date" value={filtroFin} onChange={(e) => setFiltroFin(e.target.value)} required />
                </Form.Group>
              </Col>
              <Col md={1} className="d-flex align-items-end">
                <Button type="submit" variant="primary" className="w-100" disabled={loadingReport || !selectedEmployeeId}>
                  {loadingReport ? <Spinner as="span" animation="border" size="sm" /> : <i className="bi bi-search"></i>}
                </Button>
              </Col>
            </Row>
          </Form>

          {empleadoSeleccionado && reportData.length > 0 && (
            <div className="d-flex justify-content-between align-items-center my-3">
              <div>
                <h5 className="mb-0 text-primary">{empleadoSeleccionado?.nombre}</h5>
                <p className="mb-0 text-white-50 small">{empleadoSeleccionado?.puesto}</p>
              </div>
            </div>
          )}

          <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Table striped bordered hover variant="dark" className="align-middle">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Estatus</th>
                  <th>Hora Entrada</th>
                  <th>Hora Salida</th>
                </tr>
              </thead>
              <tbody>
                {loadingReport ? (
                  <tr><td colSpan="4" className="text-center"><Spinner animation="border" /></td></tr>
                ) : reportData.length > 0 ? (
                  reportData.slice().reverse().map(item => (
                    <tr key={item.fecha}>
                      <td className="fw-bold">{formatFecha(item.fecha)}</td>
                      <td className={getStatusClass(item.status)}>{item.status}</td>
                      <td>{item.entrada}</td>
                      <td>{item.salida}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="text-center text-white-50">Selecciona un empleado para ver su reporte.</td></tr>
                )}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
      </Modal>

    </div>
  );
}

export default Kiosk;
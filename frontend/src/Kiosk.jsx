import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import Webcam from 'react-webcam';
import { Link } from 'react-router-dom'; 
import { Spinner, Alert, Card, Button } from 'react-bootstrap';
import io from 'socket.io-client';
import 'animate.css';

const socket = io(); 

function Kiosk() {
  const [status, setStatus] = useState('initializing');
  const [fingerprint, setFingerprint] = useState('');
  const webcamRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState({ variant: 'info', text: '', icon: '' });
  const [dateTime, setDateTime] = useState(new Date());

  const capture = useCallback(async () => {
    setLoading(true);
    setCheckInMessage({ variant: 'info', text: '', icon: '' });
    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc) {
      setCheckInMessage({ variant: 'warning', text: 'No se pudo capturar la imagen.', icon: 'bi-exclamation-triangle-fill' });
      setLoading(false);
      return;
    }
    try {
      const response = await axios.post('/api/attendance/check-in', { image: imageSrc, fingerprint: fingerprint });
      const employeeName = response.data.employeeName || 'Empleado';
      setCheckInMessage({ variant: 'success', text: `¡Bienvenido, ${employeeName}!`, icon: 'bi-check-circle-fill' });
    } catch (error) {
      console.error('Error en el check-in:', error);
      const errorMsg = error.response?.data?.message || 'Error de conexión.';
      setCheckInMessage({ variant: 'danger', text: errorMsg, icon: 'bi-x-circle-fill' });
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
        setStatus(response.data.isAuthorized ? 'approved' : (response.data.status || 'pending'));
      } catch (error) {
        console.error('Error verificando el dispositivo:', error);
        setStatus('error');
      }
    };
    getFingerprintAndVerify();

    const timerId = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timerId); 

  }, []);

  const formatDateTime = (date) => {
    const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, hourCycle: 'h12' };
    return {
      date: date.toLocaleDateString('es-MX', optionsDate),
      time: date.toLocaleTimeString('es-MX', optionsTime),
    };
  };

  const { date, time } = formatDateTime(dateTime);

  const renderStatus = (icon, color, title, text, code = null) => (
    <Card bg="dark" text="white" className="text-center shadow-lg border-0 mx-auto animate__animated animate__fadeIn" style={{ maxWidth: '480px', borderRadius: '1rem' }}>
      <Card.Body className="p-5">
        <i className={`bi ${icon} display-3 mb-4 text-${color}`}></i>
        <Card.Title as="h2" className="mb-3 fw-bold">{title}</Card.Title>
        <Card.Text className="text-muted fs-5">{text}</Card.Text>
        {code && <p className="mt-4 bg-secondary bg-opacity-10 p-3 rounded text-muted font-monospace"><small>Código: {code}</small></p>}
      </Card.Body>
    </Card>
  );

  const renderApproved = () => (
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
            
            <Button
              variant="primary"
              size="lg"
              className="w-100 d-flex align-items-center justify-content-center py-3 fs-5 shadow-sm rounded-pill"
              onClick={capture}
              disabled={loading}
              style={{ transition: 'all 0.2s ease-in-out' }}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" /> Verificando...
                </>
              ) : (
                <><i className="bi bi-camera-fill me-2 fs-4"></i> Registrar Asistencia</>
              )}
            </Button>
            
            <div className="mt-3" style={{ minHeight: '60px' }}>
              {checkInMessage.text && (
                <Alert variant={checkInMessage.variant} className="py-2 mb-0 small rounded-pill d-flex align-items-center justify-content-center animate__animated animate__fadeInUp">
                  <i className={`bi ${checkInMessage.icon} me-2 fs-5`}></i>
                  <span className="fw-bold">{checkInMessage.text}</span>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  const renderContent = () => {
    switch (status) {
      case 'initializing':
        return renderStatus('bi-arrow-repeat', 'primary', 'Inicializando', 'Identificando dispositivo...');
      case 'pending':
        return renderStatus('bi-hourglass-split', 'warning', 'Dispositivo Pendiente', 'Un administrador debe autorizar este equipo.', fingerprint);
      case 'approved':
        return renderApproved();
      case 'rejected':
        return renderStatus('bi-x-octagon-fill', 'danger', 'Dispositivo Rechazado', 'Este equipo no tiene permiso.');
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
    </div>
  );
}

export default Kiosk;
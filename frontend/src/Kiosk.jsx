// frontend/src/Kiosk.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import Webcam from 'react-webcam';

const API_URL = '';

function Kiosk() {
  const [status, setStatus] = useState('initializing');
  const [fingerprint, setFingerprint] = useState('');
  const webcamRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');

  const capture = useCallback(async () => {
    setLoading(true);
    setCheckInMessage('');
    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      setCheckInMessage('No se pudo capturar la imagen. Intenta de nuevo.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/attendance/check-in`, {
        image: imageSrc,
      });

      const employeeId = response.data.employeeId;
      setCheckInMessage(`✅ ¡Bienvenido! Registro exitoso para empleado ID: ${employeeId}`);

    } catch (error) {
      console.error('Error en el check-in:', error);
      setCheckInMessage('❌ Rostro no reconocido. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [webcamRef]);

  // ✅ --- ESTA ES LA PARTE QUE FALTABA --- ✅
  // Este useEffect se ejecuta una sola vez cuando el componente carga.
  // Su trabajo es identificar el dispositivo y preguntar al backend si tiene permiso.
  useEffect(() => {
    const getFingerprintAndVerify = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      const deviceFingerprint = result.visitorId;
      setFingerprint(deviceFingerprint);

      try {
        const response = await axios.post(`${API_URL}/api/devices/verify`, {
          fingerprint: deviceFingerprint,
        });
        
        if (response.data.isAuthorized) {
          setStatus('approved'); // Si está autorizado, mostramos la cámara
        } else {
          setStatus(response.data.status || 'pending'); // Si no, mostramos "pendiente"
        }
      } catch (error) {
        console.error('Error verificando el dispositivo:', error);
        setStatus('error');
      }
    };

    getFingerprintAndVerify();
  }, []); // El array vacío [] es importante para que solo se ejecute una vez.

  const renderContent = () => {
    switch (status) {
      case 'initializing':
        return <h2>Identificando dispositivo...</h2>;
      case 'pending':
        return (
          <div>
            <h1>Dispositivo Pendiente de Aprobación</h1>
            <p>Un administrador debe autorizar este equipo desde el panel.</p>
            <p className="fingerprint-code">Código: {fingerprint}</p>
          </div>
        );
      
      case 'approved':
        return (
          <div>
            <h1>Reloj Checador Autorizado</h1>
            <div className="webcam-container">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={720}
                videoConstraints={{ facingMode: "user" }}
              />
            </div>
            <button onClick={capture} className="capture-button" disabled={loading}>
              {loading ? 'Verificando...' : 'Checar Entrada / Salida'}
            </button>
            {checkInMessage && <p className="check-in-message">{checkInMessage}</p>}
          </div>
        );
        
      case 'rejected':
        return <h2>❌ Este dispositivo ha sido rechazado.</h2>;
      default:
        return <h2>⚠️ Ocurrió un error. Revisa la conexión con el servidor.</h2>;
    }
  };

  return <div className="kiosk-container">{renderContent()}</div>;
}

export default Kiosk;
// frontend/src/AdminPanel.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';

const API_URL = '';

// Opciones para los menús desplegables
const sucursales = ["tx1", "tx2", "Tx3"];
const puestos = ["ayudante a", "ayudante b", "chofer", "encargado", "supervisor"];
const salarios = { "ayudante a": 261.33, "Chofer": 261.33, "Encargado": 261.33 };
const bonos = { "puntualidad": 300.00 };

function AdminPanel() {
  // --- Estados del Componente ---
  const [nombre, setNombre] = useState('');
  const [sucursal, setSucursal] = useState('');
  const [puesto, setPuesto] = useState('');
  const [salario, setSalario] = useState(0);
  const [bono, setBono] = useState(0);
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [horaEntrada, setHoraEntrada] = useState('');
  const [horaSalida, setHoraSalida] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [message, setMessage] = useState('Completa el formulario para registrar un nuevo empleado.');
  const [isRegistering, setIsRegistering] = useState(false);
  const webcamRef = useRef(null);
  
  // --- Lógica del Componente ---
  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  }, [webcamRef]);

  const handleRegisterEmployee = async (e) => {
    e.preventDefault();
    if (!nombre || !capturedImage) {
      setMessage('El nombre y la foto son obligatorios.');
      return;
    }
    setIsRegistering(true);
    setMessage('Registrando empleado...');

    try {
      const employeeData = { nombre, sucursal, puesto, salario, bono, fechaIngreso, horaEntrada, horaSalida };
      const employeeResponse = await axios.post(`${API_URL}/api/employees`, employeeData);
      const employeeId = employeeResponse.data.id;
      
      setMessage(`Empleado creado (ID: ${employeeId}). Registrando rostro...`);
      
      await axios.post(`${API_URL}/api/employees/${employeeId}/register-face`, {
        image: capturedImage,
      });

      setMessage(`✅ ¡Empleado ${nombre} registrado con éxito!`);
      // Resetear formulario
      setNombre('');
      setSucursal('');
      setPuesto('');
      setSalario(0);
      setBono(0);
      setFechaIngreso('');
      setHoraEntrada('');
      setHoraSalida('');
      setCapturedImage(null);

    } catch (error) {
      console.error('Error en el registro:', error);
      setMessage('❌ Hubo un error durante el registro.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* ======================= BARRA LATERAL (SIDEBAR) ======================= */}
      <aside className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark" style={{ width: '280px' }}>
        <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
          <i className="bi bi-shield-lock-fill me-2 fs-4"></i>
          <span className="fs-4">PANEL ADMIN</span>
        </a>
        <hr />
        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item mb-1">
            <a href="#" className="nav-link active" aria-current="page">
              <i className="bi bi-person-plus-fill me-2"></i>
              Nuevo Registr
            </a>
          </li>
          <li>
            <a href="#" className="nav-link text-white">
              <i className="bi bi-clipboard2-data-fill me-2"></i>
              Registros
            </a>
          </li>
          <li>
            <a href="#" className="nav-link text-white">
              <i className="bi bi-clipboard2-data-fill me-2"></i>
              Registros
            </a>
          </li>
          <li>
            <a href="#" className="nav-link text-white">
                <i className="bi bi-people-fill me-2"></i>
                Empleados
            </a>
          </li>
        </ul>
        <hr />
        <div className="dropdown">
          <a href="#" className="d-flex align-items-center text-white text-decoration-none">
            <i className="bi bi-box-arrow-left me-2"></i>
            <strong>Cerrar Sesión</strong>
          </a>
        </div>
      </aside>

      {/* ======================= CONTENIDO PRINCIPAL ======================= */}
      <main className="w-100 p-4" style={{ overflowY: 'auto' }}>
        <header className="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom">
          <h1 className="h3">Nuevo Registro de Empleado</h1>
          <div className="text-body-secondary">
            <span>{new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </header>

        {message && <div className="alert alert-info">{message}</div>}

        <form onSubmit={handleRegisterEmployee} className="row g-4">
          {/* Columna de Datos Personales */}
          <div className="col-lg-7">
            <div className="card h-100">
              <div className="card-header">Datos Personales y Laborales</div>
              <div className="card-body">
                {/* ... (aquí va todo el formulario de datos: nombre, sucursal, etc.) ... */}
                <div className="mb-3">
                  <label className="form-label">Nombre Completo</label>
                  <input type="text" className="form-control" value={nombre} onChange={e => setNombre(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Sucursal</label>
                  <select className="form-select" value={sucursal} onChange={e => setSucursal(e.target.value)}>
                    <option value="">Seleccione sucursal...</option>
                    {sucursales.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {/* ... y así con todos los demás campos ... */}
              </div>
            </div>
          </div>

          {/* Columna de Registro Facial */}
          <div className="col-lg-5">
            <div className="card h-100">
              <div className="card-header">Registro Facial</div>
              <div className="card-body text-center d-flex flex-column">
                <div className="webcam-container bg-secondary rounded mb-3 flex-grow-1 d-flex align-items-center justify-content-center">
                  {capturedImage ? (
                    <img src={capturedImage} alt="Foto capturada" className="img-fluid" />
                  ) : (
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="img-fluid"
                    />
                  )}
                </div>
                <div className="btn-group">
                  <button type="button" onClick={capturePhoto} className="btn btn-outline-primary">
                    <i className="bi bi-camera-fill me-1"></i> Tomar Foto
                  </button>
                  <button type="button" onClick={() => setCapturedImage(null)} className="btn btn-outline-warning">
                    <i className="bi bi-arrow-repeat me-1"></i> Repetir
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-12 mt-4">
              <button type="submit" className="btn btn-primary btn-lg w-100" disabled={isRegistering}>
                {isRegistering ? 'Registrando...' : '💾 Registrar Empleado'}
              </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default AdminPanel;
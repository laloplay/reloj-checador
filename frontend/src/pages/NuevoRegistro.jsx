import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';

const API_URL = '';

function NuevoRegistro() {
  // --- Estados para los datos del formulario ---
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

  // --- Estados para las listas dinámicas de los menús ---
  const [listaPuestos, setListaPuestos] = useState([]);
  const [listaSucursales, setListaSucursales] = useState([]);
  const [listaBonos, setListaBonos] = useState([]);

  // --- Estados de UI (mensajes, carga, etc.) ---
  const [message, setMessage] = useState('Completa el formulario para registrar un nuevo empleado.');
  const [isRegistering, setIsRegistering] = useState(false);
  const webcamRef = useRef(null);

  // --- Cargar datos para los selects al iniciar el componente ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [puestosRes, sucursalesRes, bonosRes] = await Promise.all([
          axios.get(`/api/puestos`),
          axios.get(`/api/sucursales`),
          axios.get(`/api/bonos`)
        ]);
        setListaPuestos(puestosRes.data);
        setListaSucursales(sucursalesRes.data);
        setListaBonos(bonosRes.data);
      } catch (error) {
        setMessage('❌ Error al cargar datos. Revisa la conexión con el backend.');
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // --- Lógica para vincular Puesto con Salario ---
  const handlePuestoChange = (e) => {
    const selectedPuestoId = e.target.value;
    setPuestoId(selectedPuestoId);
    const selectedPuesto = listaPuestos.find(p => p.id === parseInt(selectedPuestoId));
    if (selectedPuesto) {
      setSalario(selectedPuesto.salarioDiario);
    } else {
      setSalario(0);
    }
  };

  // --- Lógica para vincular Bono con Monto ---
  const handleBonoChange = (e) => {
    const selectedBonoId = e.target.value;
    setBonoId(selectedBonoId);
    const selectedBono = listaBonos.find(b => b.id === parseInt(selectedBonoId));
    if (selectedBono) {
      setBono(selectedBono.monto);
    } else {
      setBono(0);
    }
  };

  // --- Lógica para capturar foto ---
  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  }, [webcamRef]);

  // --- Lógica para enviar el formulario completo ---
  const handleRegisterEmployee = async (e) => {
    e.preventDefault();
    if (!nombre || !capturedImage) {
      setMessage('El nombre y la foto son obligatorios.');
      return;
    }
    setIsRegistering(true);
    setMessage('Registrando empleado...');

    try {
      // Encuentra el nombre del puesto a partir de su ID
      const puestoSeleccionado = listaPuestos.find(p => p.id === parseInt(puestoId))?.nombre || '';

      const employeeData = { 
        nombre: nombre.toUpperCase(), 
        sucursal, 
        puesto: puestoSeleccionado, 
        salario, 
        bono, 
        fechaIngreso, 
        horaEntrada, 
        horaSalida 
      };

      const employeeResponse = await axios.post(`${API_URL}/api/employees`, employeeData);
      const employeeId = employeeResponse.data.id;
      
      setMessage(`Empleado creado (ID: ${employeeId}). Registrando rostro...`);
      
      await axios.post(`${API_URL}/api/employees/${employeeId}/register-face`, {
        image: capturedImage,
      });

      setMessage(`✅ ¡Empleado ${nombre.toUpperCase()} registrado con éxito!`);
      // Resetear formulario
      setNombre(''); setSucursal(''); setPuestoId(''); setSalario(0);
      setBonoId(''); setBono(0); setFechaIngreso(''); setHoraEntrada('');
      setHoraSalida(''); setCapturedImage(null);

    } catch (error) {
      console.error('Error en el registro:', error);
      setMessage(`❌ Hubo un error durante el registro: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div>
      <header className="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom">
        <h1 className="h3">Nuevo Registro de Empleado</h1>
      </header>

      {message && <div className="alert alert-info">{message}</div>}

      <form onSubmit={handleRegisterEmployee} className="row g-4">
        {/* Columna de Datos Personales */}
        <div className="col-lg-7">
          <div className="card h-100">
            <div className="card-header">Datos Personales y Laborales</div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Nombre Completo</label>
                <input type="text" className="form-control" value={nombre} onChange={e => setNombre(e.target.value.toUpperCase())} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Sucursal</label>
                <select className="form-select" value={sucursal} onChange={e => setSucursal(e.target.value)} required>
                  <option value="">Seleccione sucursal...</option>
                  {listaSucursales.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Puesto</label>
                <select className="form-select" value={puestoId} onChange={handlePuestoChange} required>
                  <option value="">Seleccione puesto...</option>
                  {listaPuestos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Salario Diario</label>
                <input type="text" className="form-control" value={`$${parseFloat(salario).toFixed(2)}`} readOnly disabled />
              </div>
              <div className="mb-3">
                <label className="form-label">Bono (Opcional)</label>
                <select className="form-select" value={bonoId} onChange={handleBonoChange}>
                  <option value="">Ninguno</option>
                  {listaBonos.map(b => <option key={b.id} value={b.id}>{`${b.nombre} ($${parseFloat(b.monto).toFixed(2)})`}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Fecha de Ingreso</label>
                <input type="date" className="form-control" value={fechaIngreso} onChange={e => setFechaIngreso(e.target.value)} />
              </div>
              <div className="row">
                <div className="col-6">
                  <label className="form-label">Hora de Entrada</label>
                  <input type="time" className="form-control" value={horaEntrada} onChange={e => setHoraEntrada(e.target.value)} />
                </div>
                <div className="col-6">
                  <label className="form-label">Hora de Salida</label>
                  <input type="time" className="form-control" value={horaSalida} onChange={e => setHoraSalida(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna de Registro Facial */}
        <div className="col-lg-5">
          <div className="card h-100">
            <div className="card-header">Registro Facial</div>
            <div className="card-body text-center d-flex flex-column">
              <div className="webcam-container bg-body-tertiary rounded mb-3 flex-grow-1 d-flex align-items-center justify-content-center" style={{minHeight: '250px'}}>
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
    </div>
  );
}

export default NuevoRegistro;
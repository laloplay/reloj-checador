import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Alert, Spinner, Card, Form, ListGroup, Row, Col } from 'react-bootstrap';
import 'animate.css';

function DiasDescansoAdmin() {
  const [empleados, setEmpleados] = useState([]);
  const [listaSucursales, setListaSucursales] = useState([]); // <-- NUEVO
  const [filtroSucursal, setFiltroSucursal] = useState('TODAS'); // <-- NUEVO
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const diasSemana = [
    { valor: 0, nombre: 'Dom' },
    { valor: 1, nombre: 'Lun' },
    { valor: 2, nombre: 'Mar' },
    { valor: 3, nombre: 'Mié' },
    { valor: 4, nombre: 'Jue' },
    { valor: 5, nombre: 'Vie' },
    { valor: 6, nombre: 'Sáb' },
  ];

  // Carga los empleados CADA VEZ que el filtro de sucursal cambia
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/dias-descanso', {
          params: { sucursal: filtroSucursal } // <-- ¡AQUÍ ESTÁ LA MAGIA DEL FILTRO!
        });
        setEmpleados(response.data);
      } catch (error) { 
        console.error("Error cargando empleados", error); 
        setMessage({ type: 'danger', text: 'Error al cargar los empleados.' });
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [filtroSucursal]); // <-- Se ejecuta de nuevo si 'filtroSucursal' cambia

  // Carga la lista de sucursales UNA SOLA VEZ al inicio
  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const response = await axios.get('/api/sucursales');
        setListaSucursales(response.data);
      } catch (error) {
        console.error("Error cargando sucursales:", error);
      }
    };
    fetchSucursales();
  }, []);

  const handleDescansoChange = async (employeeId, diaValor, isChecked) => {
    try {
      await axios.post('/api/dias-descanso/toggle', { 
        employeeId: employeeId, 
        dia_semana: diaValor,
        isChecked: isChecked
      });
      setMessage({ type: 'success', text: 'Día de descanso actualizado.' });
      
      setEmpleados(prevEmpleados => 
        prevEmpleados.map(emp => {
          if (emp.id === employeeId) {
            let nuevosDescansos = [...(emp.DiaDescansos || [])];
            if (isChecked) {
              nuevosDescansos.push({ dia_semana: diaValor });
            } else {
              nuevosDescansos = nuevosDescansos.filter(d => d.dia_semana !== diaValor);
            }
            return { ...emp, DiaDescansos: nuevosDescansos };
          }
          return emp;
        })
      );

    } catch (error) { 
      setMessage({ type: 'danger', text: `Error: ${error.response?.data?.error || 'No se pudo guardar.'}` }); 
    }
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-white-50 mt-2">Cargando empleados...</p>
        </div>
      );
    }

    if (empleados.length === 0 && filtroSucursal === 'TODAS') {
      return (
        <p className="text-white-50 p-4 text-center">
          <i className="bi bi-people-fill me-2 fs-4"></i>
          No hay empleados registrados.
        </p>
      );
    }
    
    if (empleados.length === 0 && filtroSucursal !== 'TODAS') {
      return (
        <p className="text-white-50 p-4 text-center">
          No se encontraron empleados para la sucursal "{filtroSucursal}".
        </p>
      );
    }

    return (
      <ListGroup variant="flush">
        {empleados.map((item, index) => (
          <ListGroup.Item key={item.id} className="bg-dark text-white d-flex flex-column flex-md-row justify-content-between align-items-md-center p-3" style={ index === 0 ? { borderTop: 'none' } : {}}>
            <div className="mb-2 mb-md-0">
              <span className="fw-bold fs-5">{item.nombre}</span>
              <span className="ms-2 badge bg-success">{item.sucursal}</span>
            </div>
            
            <div className="d-flex w-100 w-md-auto">
              <Form className="d-flex flex-wrap justify-content-end">
                {diasSemana.map(dia => {
                  const isChecked = item.DiaDescansos ? item.DiaDescansos.some(d => d.dia_semana === dia.valor) : false;
                  return (
                    <Form.Check 
                      type="checkbox"
                      id={`check-${item.id}-${dia.valor}`}
                      label={dia.nombre}
                      key={dia.valor}
                      className="me-3"
                      checked={isChecked}
                      onChange={(e) => handleDescansoChange(item.id, dia.valor, e.target.checked)}
                    />
                  );
                })}
              </Form>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    );
  };

  return (
    <div className="animate__animated animate__fadeIn" data-bs-theme="dark"> 
      <header className="pb-3 mb-4 border-bottom border-secondary d-flex justify-content-between align-items-center">
        <h1 className="h3 text-white-50">Gestión de Días de Descanso</h1>
        
        {/* --- FILTRO DE SUCURSAL --- */}
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
      
      <Card bg="dark" text="white" className="shadow-lg border-0" style={{ borderRadius: '1rem' }}>
         <Card.Header className="bg-primary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
          <h5 className="mb-0"><i className="bi bi-calendar-x-fill me-2"></i>Asignar Descanso Semanal</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {renderContent()}
        </Card.Body>
      </Card>
    </div>
  );
}

export default DiasDescansoAdmin;
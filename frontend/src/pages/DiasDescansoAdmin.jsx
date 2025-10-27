import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Alert, Spinner, Card, Form, ListGroup } from 'react-bootstrap';
import 'animate.css';

function DiasDescansoAdmin() {
  const [empleados, setEmpleados] = useState([]);
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

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/dias-descanso');
      setEmpleados(response.data);
    } catch (error) { 
      console.error("Error cargando empleados", error); 
      setMessage({ type: 'danger', text: 'Error al cargar los empleados.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleDescansoChange = async (employeeId, diaValor, isChecked) => {
    try {
      // Llamamos a la nueva API "toggle"
      await axios.post('/api/dias-descanso/toggle', { 
        employeeId: employeeId, 
        dia_semana: diaValor,
        isChecked: isChecked
      });
      setMessage({ type: 'success', text: 'Día de descanso actualizado.' });
      
      // Actualizamos el estado localmente para que se vea el check al instante
      setEmpleados(prevEmpleados => 
        prevEmpleados.map(emp => {
          if (emp.id === employeeId) {
            let nuevosDescansos = [...(emp.DiaDescansos || [])];
            if (isChecked) {
              // Añadir
              nuevosDescansos.push({ dia_semana: diaValor });
            } else {
              // Quitar
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

    if (empleados.length === 0) {
      return (
        <p className="text-white-50 p-4 text-center">
          <i className="bi bi-people-fill me-2 fs-4"></i>
          No hay empleados registrados.
        </p>
      );
    }

    return (
      <ListGroup variant="flush">
        {empleados.map((item, index) => (
          <ListGroup.Item key={item.id} className="bg-dark text-white d-flex flex-column flex-md-row justify-content-between align-items-md-center p-3" style={ index === 0 ? { borderTop: 'none' } : {}}>
            <div className="mb-2 mb-md-0">
              <span className="fw-bold fs-5">{item.nombre}</span>
            </div>
            
            {/* --- CHECKBOXES PARA MÚLTIPLES DÍAS --- */}
            <div className="d-flex w-100 w-md-auto">
              <Form className="d-flex flex-wrap">
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
      <header className="pb-3 mb-4 border-bottom border-secondary">
        <h1 className="h3 text-white-50">Gestión de Días de Descanso</h1>
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
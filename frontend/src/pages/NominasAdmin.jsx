import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Alert, Spinner, Card, Form, Row, Col, Button, Modal, Table, ListGroup } from 'react-bootstrap';
import 'animate.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function NominasAdmin() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [nombreNomina, setNombreNomina] = useState('');
  
  const [calculo, setCalculo] = useState([]);
  const [runs, setRuns] = useState([]);
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    try {
      const res = await axios.get('/api/nomina/runs');
      setRuns(res.data);
    } catch (error) { console.error("Error cargando nóminas guardadas", error); }
  };

  const handleCalcular = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await axios.post('/api/nomina/calcular', { fecha_inicio: fechaInicio, fecha_fin: fechaFin });
      setCalculo(res.data);
    } catch (error) {
      setMessage({ type: 'danger', text: 'Error al calcular la nómina.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    if (!nombreNomina || calculo.length === 0) {
      setMessage({ type: 'warning', text: 'Nombra la nómina y calcula los datos primero.' });
      return;
    }
    try {
      const newRun = await axios.post('/api/nomina/guardar', {
        nombre: nombreNomina,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        detalles: calculo
      });
      setMessage({ type: 'success', text: `Nómina "${newRun.data.nombre}" guardada.` });
      setCalculo([]);
      setNombreNomina('');
      fetchRuns();
    } catch (error) {
      setMessage({ type: 'danger', text: 'Error al guardar la nómina.' });
    }
  };

  const handleVerRun = async (id) => {
    try {
      const res = await axios.get(`/api/nomina/runs/${id}`);
      setSelectedRun(res.data);
      setShowModal(true);
    } catch (error) {
      setMessage({ type: 'danger', text: 'Error al cargar los detalles.' });
    }
  };

  const handlePrintRecibo = (detalle) => {
    const doc = new jsPDF();
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("ENVASES UNIFAM SA DE CV", 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`R.F.C.: ${detalle.rfc}`, 105, 26, { align: 'center' });

    doc.rect(14, 32, 100, 30);
    doc.rect(124, 32, 72, 30);
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text("PERIODO LABORADO", 159, 38, { align: 'center' });
    doc.text(`DEL ${new Date(selectedRun.run.fecha_inicio).toLocaleDateString('es-MX')} AL ${new Date(selectedRun.run.fecha_fin).toLocaleDateString('es-MX')}`, 159, 44, { align: 'center' });
    
    doc.text("SALARIO DIARIO", 159, 54, { align: 'center' });
    doc.setFont(undefined, 'normal');
    doc.text(`$${detalle.salario_diario.toFixed(2)}`, 159, 60, { align: 'center' });

    doc.text("NOMBRE", 16, 38);
    doc.text("PUESTO", 16, 44);
    doc.text("FECHAS DE FALTAS", 16, 50);
    doc.text("DIAS LABORADOS", 16, 56);
    doc.text("FECHA DE INGRESO", 16, 62);
    
    doc.setFont(undefined, 'normal');
    doc.text(detalle.nombre, 50, 38);
    doc.text(detalle.puesto, 50, 44);
    doc.text("Ninguna", 50, 50);
    doc.text(detalle.dias_laborados.toString(), 50, 56);
    doc.text(detalle.fecha_ingreso, 50, 62);

    doc.setFont(undefined, 'bold');
    doc.text("PERCEPCIONES", 16, 75);
    doc.setFont(undefined, 'normal');
    doc.text("SUELDO", 16, 82);
    doc.text(`$${detalle.sueldo.toFixed(2)}`, 100, 82, { align: 'right' });
    
    let y = 82;
    if (detalle.bono_puntualidad > 0) {
      y += 6;
      doc.text("BONO PUNTUALIDAD", 16, y);
      doc.text(`$${detalle.bono_puntualidad.toFixed(2)}`, 100, y, { align: 'right' });
    }
    if (detalle.comision > 0) {
      y += 6;
      doc.text("COMISION", 16, y);
      doc.text(`$${detalle.comision.toFixed(2)}`, 100, y, { align: 'right' });
    }
    
    y += 12;
    doc.setFont(undefined, 'bold');
    doc.text("DEDUCCIONES", 16, y);
    doc.setFont(undefined, 'normal');
    
    if (detalle.otras_deducciones > 0) {
      y += 7;
      doc.text("OTRAS DEDUCCIONES", 16, y);
      doc.text(`-$${detalle.otras_deducciones.toFixed(2)}`, 100, y, { align: 'right' });
    }
    
    y += 10;
    doc.rect(134, y - 5, 62, 10);
    doc.setFont(undefined, 'bold');
    doc.text("NETO A PAGAR:", 136, y);
    doc.text(`$${detalle.neto_a_pagar.toFixed(2)}`, 194, y, { align: 'right' });

    y += 15;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text("recibí de: ENVASES UNIFAM SA DE CV la cantidad de dinero en moneda nacional anotada en la casilla de neto a pagar, que cubre el importe de mi sueldo y demás prestaciones correspondientes al periodo laborado y que se precisan en este recibo por los servicios prestados a la empresa, expresando mi conformidad con las percepciones y deducciones que en el texto del mismo se consignan.", 14, y, { maxWidth: 182, align: 'justify' });
    
    y += 20;
    doc.line(70, y, 140, y);
    doc.text("Firma de recibido y conformidad", 105, y + 4, { align: 'center' });

    doc.save(`Recibo_${detalle.nombre.replace(/\s/g, '_')}.pdf`);
  };

  const formatFecha = (dateString) => new Date(dateString).toLocaleDateString('es-MX', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="animate__animated animate__fadeIn" data-bs-theme="dark">
      <header className="pb-3 mb-4 border-bottom border-secondary">
        <h1 className="h3 text-white-50">Generar Nóminas</h1>
      </header>
      
      {message.text && (<Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>{message.text}</Alert>)}
      
      <Row className="g-4">
        <Col lg={4}>
          <Card bg="dark" text="white" className="shadow-sm border-0" style={{ borderRadius: '1rem' }}>
            <Card.Header className="bg-primary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
              <h5 className="mb-0"><i className="bi bi-calendar-range-fill me-2"></i>Paso 1: Calcular Nómina</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleCalcular}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Inicio</Form.Label>
                  <Form.Control type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Fin</Form.Label>
                  <Form.Control type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} required />
                </Form.Group>
                <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                  {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Calcular'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={8}>
          <Card bg="dark" text="white" className="shadow-sm border-0" style={{ borderRadius: '1rem' }}>
             <Card.Header className="bg-primary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
              <h5 className="mb-0"><i className="bi bi-clipboard2-data-fill me-2"></i>Paso 2: Revisar y Guardar</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <Table striped bordered hover variant="dark" size="sm">
                  <thead><tr><th>Empleado</th><th>Días</th><th>Sueldo</th><th>Bonos</th><th>Comisión</th><th>Deducción</th><th>Neto a Pagar</th></tr></thead>
                  <tbody>
                    {loading && <tr><td colSpan="7" className="text-center"><Spinner animation="border" size="sm" /></td></tr>}
                    {calculo.map(item => (
                      <tr key={item.employeeId}>
                        <td>{item.nombre}</td>
                        <td>{item.dias_laborados}</td>
                        <td>${item.sueldo.toFixed(2)}</td>
                        <td>${item.bono_puntualidad.toFixed(2)}</td>
                        <td>${item.comision.toFixed(2)}</td>
                        <td>${item.otras_deducciones.toFixed(2)}</td>
                        <td className="fw-bold">${item.neto_a_pagar.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <hr/>
              <Form.Group className="mb-3">
                <Form.Label>Nombre de la Nómina (Ej: 1ra Quincena Octubre)</Form.Label>
                <Form.Control type="text" value={nombreNomina} onChange={(e) => setNombreNomina(e.target.value)} placeholder="Nombre de esta corrida..." />
              </Form.Group>
              <Button variant="success" className="w-100" disabled={calculo.length === 0 || !nombreNomina} onClick={handleGuardar}>
                <i className="bi bi-save-fill me-2"></i>Guardar Nómina
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card bg="dark" text="white" className="shadow-sm border-0 mt-4" style={{ borderRadius: '1rem' }}>
         <Card.Header className="bg-secondary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
          <h5 className="mb-0"><i className="bi bi-archive-fill me-2"></i>Nóminas Guardadas</h5>
        </Card.Header>
        <Card.Body>
          <ListGroup variant="flush">
            {runs.map(run => (
              <ListGroup.Item key={run.id} className="bg-dark text-white d-flex justify-content-between align-items-center">
                <div>
                  <span className="fw-bold">{run.nombre}</span>
                  <br/>
                  <small className="text-white-50">{formatFecha(run.fecha_inicio)} - {formatFecha(run.fecha_fin)}</small>
                </div>
                <Button variant="outline-primary" size="sm" onClick={() => handleVerRun(run.id)}>
                  Ver Detalles y Recibos
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </Card>
      
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered data-bs-theme="dark">
        <Modal.Header closeButton>
          <Modal.Title>{selectedRun?.run.nombre}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="table-responsive">
            <Table striped bordered hover variant="dark">
              <thead><tr><th>Empleado</th><th>Sueldo</th><th>Percepciones</th><th>Deducciones</th><th>Neto</th><th>Acciones</th></tr></thead>
              <tbody>
                {selectedRun?.detalles.map(d => (
                  <tr key={d.id}>
                    <td>{d.nombre}</td>
                    <td>${d.sueldo.toFixed(2)}</td>
                    <td>${d.total_percepciones.toFixed(2)}</td>
                    <td>-${d.otras_deducciones.toFixed(2)}</td>
                    <td className="fw-bold">${d.neto_a_pagar.toFixed(2)}</td>
                    <td>
                      <Button variant="outline-info" size="sm" onClick={() => handlePrintRecibo(d)}>
                        <i className="bi bi-printer-fill"></i> Imprimir Recibo
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default NominasAdmin;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Spinner, Alert, Card, Button, Form, Row, Col, Modal, Table } from 'react-bootstrap';
import 'animate.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // <-- ¡CAMBIO #1: IMPORTACIÓN CORREGIDA!

const getToday = () => new Date().toISOString().split('T')[0];

const getDefaultStartDate = () => {
  const today = new Date();
  const last15 = new Date(today.setDate(today.getDate() - 14));
  return last15.toISOString().split('T')[0];
};

function RegistrosAdmin() {
  const [empleados, setEmpleados] = useState([]);
  const [listaSucursales, setListaSucursales] = useState([]);
  const [reporte, setReporte] = useState([]);
  
  const [filtroSucursal, setFiltroSucursal] = useState('TODAS');
  const [filtroEmpleado, setFiltroEmpleado] = useState('');
  const [filtroInicio, setFiltroInicio] = useState(getDefaultStartDate());
  const [filtroFin, setFiltroFin] = useState(getToday());
  
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);
  const [loadingReporte, setLoadingReporte] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const sucursalesRes = await axios.get('/api/sucursales');
        setListaSucursales(sucursalesRes.data);
      } catch (error) {
        console.error("Error cargando sucursales:", error);
        setMessage({ type: 'danger', text: 'Error al cargar sucursales.' });
      }
    };
    fetchSucursales();
  }, []);

  useEffect(() => {
    const fetchEmpleados = async () => {
      setLoadingEmpleados(true);
      try {
        const empleadosRes = await axios.get('/api/employees', { params: { sucursal: filtroSucursal } });
        setEmpleados(empleadosRes.data);
        setFiltroEmpleado(''); 
        setReporte([]); 
      } catch (error) {
        console.error("Error cargando empleados:", error);
        setMessage({ type: 'danger', text: 'Error al cargar empleados.' });
      } finally {
        setLoadingEmpleados(false);
      }
    };
    fetchEmpleados();
  }, [filtroSucursal]);

  const handleVerRegistrosClick = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setFiltroInicio(getDefaultStartDate());
    setFiltroFin(getToday());
    setReporte([]);
    setShowModal(true);
  };

  const handleGenerarReporte = async (e) => {
    if (e) e.preventDefault(); 
    if (!empleadoSeleccionado) return;
    setLoadingReporte(true);
    setMessage({ type: '', text: '' });
    setReporte([]);

    try {
      const response = await axios.get('/api/registros', {
        params: {
          employeeId: empleadoSeleccionado.id,
          startDate: filtroInicio,
          endDate: filtroFin
        }
      });
      setReporte(response.data.reporte);
    } catch (error) {
      console.error("Error generando reporte:", error);
      setMessage({ type: 'danger', text: `Error: ${error.response?.data?.error || 'No se pudo generar.'}` });
    } finally {
      setLoadingReporte(false);
    }
  };
  
  useEffect(() => {
    if (showModal && empleadoSeleccionado) {
      handleGenerarReporte();
    }
  }, [showModal, empleadoSeleccionado]);

  const handlePrintPDF = () => {
    if (!empleadoSeleccionado || reporte.length === 0) return;

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor('#0d6efd');
    doc.text("Reporte de Asistencia", 14, 22);

    doc.setFontSize(12);
    doc.setTextColor('#212529');
    doc.text(`Empleado: ${empleadoSeleccionado.nombre}`, 14, 32);
    doc.setFontSize(10);
    doc.setTextColor('#6c757d');
    doc.text(`Puesto: ${empleadoSeleccionado.puesto} | Sucursal: ${empleadoSeleccionado.sucursal}`, 14, 38);
    doc.text(`Periodo: ${formatFecha(filtroInicio, true)} al ${formatFecha(filtroFin, true)}`, 14, 44);

    const tableColumn = ["Fecha", "Estatus", "Hora Entrada", "Hora Salida"];
    const tableRows = [];

    reporte.forEach(item => {
      const rowData = [
        formatFecha(item.fecha),
        item.status,
        item.entrada,
        item.salida
      ];
      tableRows.push(rowData);
    });

    // --- ¡CAMBIO #2: LLAMADA A LA FUNCIÓN CORREGIDA! ---
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      headStyles: {
        fillColor: [13, 110, 253], 
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [244, 247, 246]
      },
      didDrawCell: (data) => {
        if (data.column.index === 1) { 
          const status = data.cell.text[0];
          let color = '#000000';
          if (status === 'OK') color = '#198754';
          if (status === 'FALTA') color = '#dc3545';
          if (status === 'FEST' || status === 'DESC') color = '#6c757d';
          if (status === 'VAC' || status ==='PERM' || data.cell.text[0].startsWith('INC')) color = '#ffc107'; 
          doc.setTextColor(color);
        }
      }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor('#6c757d');
      doc.text(`© ${new Date().getFullYear()} UnifamCheck`, 14, doc.internal.pageSize.height - 10);
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 35, doc.internal.pageSize.height - 10);
    }
    
    doc.save(`Reporte_${empleadoSeleccionado.nombre.replace(/\s/g, '_')}.pdf`);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'OK': return 'text-success fw-bold';
      case 'FALTA': return 'text-danger fw-bold';
      case 'FEST': return 'text-info';
      case 'VAC': return 'text-warning';
      case 'PERM': return 'text-warning';
      case 'DESC': return 'text-secondary';
      default: return 'text-warning';
    }
  };
  
  const formatFecha = (dateString, forPDF = false) => {
    const date = new Date(dateString + 'T00:00:00');
    const options = {
      weekday: 'short', 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit',
      timeZone: 'UTC'
    };
    
    if (forPDF) {
      const optionsPDF = { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC' };
      return new Date(date).toLocaleDateString('es-MX', optionsPDF);
    }

    let formatted = new Date(date).toLocaleDateString('es-MX', options);
    return formatted.replace('.', '').replace(',', ''); 
  };

  return (
    <div className="animate__animated animate__fadeIn" data-bs-theme="dark"> 
      <header className="pb-3 mb-4 border-bottom border-secondary d-flex justify-content-between align-items-center">
        <h1 className="h3 text-white-50">Reportes de Asistencia</h1>
      </header>
      
      {message.text && (
        <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>
          {message.text}
        </Alert>
      )}
      
      <Card bg="dark" text="white" className="shadow-lg border-0 mb-4" style={{ borderRadius: '1rem' }} id="filtro-card">
        <Card.Header className="bg-primary text-white border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
          <h5 className="mb-0"><i className="bi bi-filter-fill me-2"></i>Filtrar Empleados</h5>
        </Card.Header>
        <Card.Body className="p-4">
          <Form.Group>
            <Form.Label>Selecciona una Sucursal para ver empleados</Form.Label>
            <Form.Select value={filtroSucursal} onChange={(e) => setFiltroSucursal(e.target.value)}>
              <option value="TODAS">Mostrar Todas las Sucursales</option>
              {listaSucursales.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
            </Form.Select>
          </Form.Group>
        </Card.Body>
      </Card>

      {loadingEmpleados ? (
        <div className="text-center p-5"><Spinner animation="border" variant="primary" /><p className="text-white-50 mt-2">Cargando empleados...</p></div>
      ) : (
        <Card bg="dark" text="white" className="shadow-sm border-0 mt-4 animate__animated animate__fadeIn" style={{ borderRadius: '1rem' }}>
          <Card.Header className="bg-dark text-white-50 border-0" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
            <h5 className="mb-0"><i className="bi bi-people-fill me-2"></i>Empleados en {filtroSucursal === 'TODAS' ? 'Todas las Sucursales' : filtroSucursal}</h5>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Sucursal</th>
                    <th>Puesto</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {empleados.map(item => (
                    <tr key={item.id}>
                      <td className="fw-bold">{item.nombre}</td>
                      <td>{item.sucursal}</td>
                      <td>{item.puesto}</td>
                      <td className="text-end">
                        <Button variant="primary" size="sm" onClick={() => handleVerRegistrosClick(item)}>
                          <i className="bi bi-search me-2"></i>Ver Registros
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered data-bs-theme="dark">
        <div id="reporte-para-imprimir">
          <Modal.Header className="bg-dark text-white-50" closeButton>
            <Modal.Title>
              Reporte de Asistencia
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-dark text-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="mb-0 text-primary">{empleadoSeleccionado?.nombre}</h5>
                <p className="mb-0 text-white-50 small">{empleadoSeleccionado?.puesto} | {empleadoSeleccionado?.sucursal}</p>
              </div>
              <Button variant="outline-light" onClick={handlePrintPDF} className="no-print">
                <i className="bi bi-printer-fill me-2"></i>Descargar PDF
              </Button>
            </div>
            
            <Form onSubmit={handleGenerarReporte}>
              <Row className="g-3 mb-3 no-print">
                <Col md={5}>
                  <Form.Group>
                    <Form.Label>Fecha Inicio</Form.Label>
                    <Form.Control type="date" value={filtroInicio} onChange={(e) => setFiltroInicio(e.target.value)} required />
                  </Form.Group>
                </Col>
                <Col md={5}>
                  <Form.Group>
                    <Form.Label>Fecha Fin</Form.Label>
                    <Form.Control type="date" value={filtroFin} onChange={(e) => setFiltroFin(e.target.value)} required />
                  </Form.Group>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button type="submit" variant="primary" className="w-100" disabled={loadingReporte}>
                    {loadingReporte ? <Spinner as="span" animation="border" size="sm" /> : <i className="bi bi-search"></i>}
                  </Button>
                </Col>
              </Row>
            </Form>
            
            <div className="table-responsive">
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
                  {loadingReporte ? (
                    <tr><td colSpan="4" className="text-center"><Spinner animation="border" /></td></tr>
                  ) : (
                    reporte.map(item => (
                      <tr key={item.fecha}>
                        <td className="fw-bold">{formatFecha(item.fecha)}</td>
                        <td className={getStatusClass(item.status)}>{item.status}</td>
                        <td>{item.entrada}</td>
                        <td>{item.salida}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Modal.Body>
        </div>
      </Modal>

    </div>
  );
}

export default RegistrosAdmin;
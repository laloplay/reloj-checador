import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';

const API_URL = '';

function PuestosAdmin() {
  const [items, setItems] = useState([]);
  const [nombre, setNombre] = useState('');
  const [salarioDiario, setSalarioDiario] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchItems = async () => {
    try {
      const response = await axios.get(`/api/puestos`);
      setItems(response.data);
    } catch (error) { console.error("Error cargando puestos", error); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/puestos`, { nombre, salarioDiario: parseFloat(salarioDiario) });
      setMessage(`✅ Puesto "${nombre}" creado.`);
      setNombre(''); setSalarioDiario('');
      fetchItems();
    } catch (error) { setMessage(`❌ Error: ${error.response?.data?.error || 'No se pudo crear.'}`); }
  };
  
  const handleUpdate = async () => {
    try {
      await axios.put(`${API_URL}/api/puestos/${editingItem.id}`, editingItem);
      setMessage(`✅ Puesto "${editingItem.nombre}" actualizado.`);
      setShowModal(false);
      fetchItems();
    } catch (error) { setMessage(`❌ Error al actualizar.`); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro?')) {
      try {
        await axios.delete(`${API_URL}/api/puestos/${id}`);
        setMessage('🗑️ Puesto borrado.');
        fetchItems();
      } catch (error) { setMessage('❌ Error al borrar.'); }
    }
  };

  const openEditModal = (item) => {
    setEditingItem({ ...item });
    setShowModal(true);
  };
  
  return (
    <div>
      <header className="pb-3 mb-4 border-bottom"><h1 className="h3">Gestión de Puestos y Salarios</h1></header>
      {message && <div className="alert alert-info" onClick={() => setMessage('')}>{message}</div>}
      <div className="row g-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header"><h5 className="card-title mb-0">Crear Nuevo Puesto</h5></div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Nombre del Puesto</label>
                  <input type="text" className="form-control" value={nombre} onChange={(e) => setNombre(e.target.value.toUpperCase())} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Salario Diario</label>
                  <input type="number" step="0.01" className="form-control" value={salarioDiario} onChange={(e) => setSalarioDiario(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary w-100">Crear</button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card">
            <div className="card-header"><h5 className="card-title mb-0">Puestos Existentes</h5></div>
            <div className="card-body">
              <table className="table table-hover">
                <thead><tr><th>Nombre</th><th>Salario Diario</th><th>Acciones</th></tr></thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>{item.nombre}</td>
                      <td>${parseFloat(item.salarioDiario).toFixed(2)}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-warning me-2" onClick={() => openEditModal(item)}>✏️</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton><Modal.Title>Editar Puesto</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nombre</Form.Label>
            <Form.Control type="text" value={editingItem?.nombre || ''} onChange={(e) => setEditingItem({...editingItem, nombre: e.target.value.toUpperCase()})} />
          </Form.Group>
          <Form.Group>
            <Form.Label>Salario Diario</Form.Label>
            <Form.Control type="number" step="0.01" value={editingItem?.salarioDiario || ''} onChange={(e) => setEditingItem({...editingItem, salarioDiario: e.target.value})} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleUpdate}>Guardar Cambios</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
export default PuestosAdmin;
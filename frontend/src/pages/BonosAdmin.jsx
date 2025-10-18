import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';

const API_URL = '';

function BonosAdmin() {
  const [items, setItems] = useState([]);
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchItems = async () => {
    try {
      const response = await axios.get(`/api/bonos`);
      setItems(response.data);
    } catch (error) { console.error("Error cargando bonos", error); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/bonos`, { nombre, monto: parseFloat(monto) });
      setMessage(`✅ Bono "${nombre}" creado.`);
      setNombre(''); setMonto('');
      fetchItems();
    } catch (error) { setMessage(`❌ Error: ${error.response?.data?.error || 'No se pudo crear.'}`); }
  };
  
  const handleUpdate = async () => {
    try {
      await axios.put(`${API_URL}/api/bonos/${editingItem.id}`, editingItem);
      setMessage(`✅ Bono "${editingItem.nombre}" actualizado.`);
      setShowModal(false);
      fetchItems();
    } catch (error) { setMessage(`❌ Error al actualizar.`); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro?')) {
      try {
        await axios.delete(`${API_URL}/api/bonos/${id}`);
        setMessage('🗑️ Bono borrado.');
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
      <header className="pb-3 mb-4 border-bottom"><h1 className="h3">Gestión de Bonos</h1></header>
      {message && <div className="alert alert-info" onClick={() => setMessage('')}>{message}</div>}
      <div className="row g-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header"><h5 className="card-title mb-0">Crear Nuevo Bono</h5></div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Nombre del Bono</label>
                  <input type="text" className="form-control" value={nombre} onChange={(e) => setNombre(e.target.value.toUpperCase())} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Monto</label>
                  <input type="number" step="0.01" className="form-control" value={monto} onChange={(e) => setMonto(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary w-100">Crear</button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card">
            <div className="card-header"><h5 className="card-title mb-0">Bonos Existentes</h5></div>
            <div className="card-body">
              <table className="table table-hover">
                <thead><tr><th>Nombre</th><th>Monto</th><th>Acciones</th></tr></thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>{item.nombre}</td>
                      <td>${parseFloat(item.monto).toFixed(2)}</td>
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
        <Modal.Header closeButton><Modal.Title>Editar Bono</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nombre</Form.Label>
            <Form.Control type="text" value={editingItem?.nombre || ''} onChange={(e) => setEditingItem({...editingItem, nombre: e.target.value.toUpperCase()})} />
          </Form.Group>
          <Form.Group>
            <Form.Label>Monto</Form.Label>
            <Form.Control type="number" step="0.01" value={editingItem?.monto || ''} onChange={(e) => setEditingItem({...editingItem, monto: e.target.value})} />
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
export default BonosAdmin;
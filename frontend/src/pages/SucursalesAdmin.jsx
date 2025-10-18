import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';

const API_URL = '';

function SucursalesAdmin() {
  const [items, setItems] = useState([]);
  const [nombre, setNombre] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchItems = async () => {
    try {
      const response = await axios.get(`/api/sucursales`);
      setItems(response.data);
    } catch (error) { console.error("Error cargando sucursales", error); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/sucursales`, { nombre });
      setMessage(`✅ Sucursal "${nombre}" creada.`);
      setNombre('');
      fetchItems();
    } catch (error) { setMessage(`❌ Error: ${error.response?.data?.error || 'No se pudo crear.'}`); }
  };
  
  const handleUpdate = async () => {
    try {
      await axios.put(`${API_URL}/api/sucursales/${editingItem.id}`, editingItem);
      setMessage(`✅ Sucursal "${editingItem.nombre}" actualizada.`);
      setShowModal(false);
      fetchItems();
    } catch (error) { setMessage(`❌ Error al actualizar.`); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro?')) {
      try {
        await axios.delete(`${API_URL}/api/sucursales/${id}`);
        setMessage('🗑️ Sucursal borrada.');
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
      <header className="pb-3 mb-4 border-bottom"><h1 className="h3">Gestión de Sucursales</h1></header>
      {message && <div className="alert alert-info" onClick={() => setMessage('')}>{message}</div>}
      <div className="row g-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header"><h5 className="card-title mb-0">Crear Nueva Sucursal</h5></div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Nombre de la Sucursal</label>
                  <input type="text" className="form-control" value={nombre} onChange={(e) => setNombre(e.target.value.toUpperCase())} required />
                </div>
                <button type="submit" className="btn btn-primary w-100">Crear</button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card">
            <div className="card-header"><h5 className="card-title mb-0">Sucursales Existentes</h5></div>
            <div className="card-body">
              <table className="table table-hover">
                <thead><tr><th>Nombre</th><th>Acciones</th></tr></thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>{item.nombre}</td>
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
        <Modal.Header closeButton><Modal.Title>Editar Sucursal</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Nombre</Form.Label>
            <Form.Control type="text" value={editingItem?.nombre || ''} onChange={(e) => setEditingItem({...editingItem, nombre: e.target.value.toUpperCase()})} />
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
export default SucursalesAdmin;
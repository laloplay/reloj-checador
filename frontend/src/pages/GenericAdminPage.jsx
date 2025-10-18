// frontend/src/pages/GenericAdminPage.jsx
// Este es un componente REUTILIZABLE para todas tus páginas de gestión
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';

const API_URL = '';

function GenericAdminPage({ title, apiUrl, formFields, tableHeaders }) {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchItems = async () => {
    try {
      const response = await axios.get(`apiUrl`);
      setItems(response.data);
    } catch (error) { console.error(`Error cargando ${title}`, error); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value.toUpperCase() });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingItem({ ...editingItem, [name]: value.toUpperCase() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}${apiUrl}`, formData);
      setMessage(`✅ Creado con éxito.`);
      setFormData({}); fetchItems();
    } catch (error) { setMessage(`❌ Error: ${error.response?.data?.error}`); }
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${API_URL}${apiUrl}/${editingItem.id}`, editingItem);
      setMessage(`✅ Actualizado con éxito.`);
      setShowModal(false); fetchItems();
    } catch (error) { setMessage(`❌ Error al actualizar.`); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres borrar este elemento?')) {
      try {
        await axios.delete(`${API_URL}${apiUrl}/${id}`);
        setMessage('🗑️ Borrado con éxito.'); fetchItems();
      } catch (error) { setMessage('❌ Error al borrar.'); }
    }
  };

  const openEditModal = (item) => {
    setEditingItem({ ...item });
    setShowModal(true);
  };

  return (
    <div>
      {/* ... (Aquí va todo el JSX con el formulario, la tabla y el modal) ... */}
    </div>
  );
}

export default GenericAdminPage;
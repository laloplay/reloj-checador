// frontend/src/pages/RegistrosAdmin.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function RegistrosAdmin() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistros = async () => {
      try {
        const response = await axios.get('/api/registros');
        setRegistros(response.data);
      } catch (error) {
        console.error("Error cargando registros:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRegistros();
  }, []);

  return (
    <div>
      <header className="pb-3 mb-4 border-bottom">
        <h1 className="h3">Historial de Asistencia</h1>
      </header>
      
      <div className="card">
        <div className="card-body">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4">Cargando registros...</td></tr>
              ) : (
                registros.map(registro => (
                  <tr key={registro.id}>
                    <td>{registro.Empleado?.nombre || 'N/A'}</td>
                    <td>{new Date(registro.timestamp).toLocaleDateString()}</td>
                    <td>{new Date(registro.timestamp).toLocaleTimeString()}</td>
                    <td>
                      <span className={`badge ${registro.type === 'ENTRADA' ? 'text-bg-success' : 'text-bg-danger'}`}>
                        {registro.type}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RegistrosAdmin;
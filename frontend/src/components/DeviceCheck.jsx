import { useState, useEffect } from 'react';
import { LoaderCircle, ShieldAlert, ShieldCheck } from 'lucide-react';
import api from '../services/api';

async function getFingerprint() {
  const fpModule = await import('@fingerprintjs/fingerprintjs');
  const fp = await fpModule.load();
  const result = await fp.get();
  return result.visitorId;
}

export function DeviceCheck({ children }) {
  const [estado, setEstado] = useState('cargando');

  useEffect(() => {
    const verificarDispositivo = async () => {
      let token = localStorage.getItem('device-token');

      if (!token) {
        try {
          const fingerprint = await getFingerprint();
          const { data } = await api.post('/dispositivos/registrar', { fingerprint });
          token = data.token;
          localStorage.setItem('device-token', token);
        } catch (error) {
          console.error('Error al registrar el dispositivo:', error);
          setEstado('error_registro');
          return;
        }
      }

      try {
        const { data } = await api.get('/dispositivos/verificar', {
          headers: { 'Device-Token': token },
        });

        setEstado(data.estado); // 'aprobado', 'pendiente', 'rechazado'
      } catch (error) {
        console.error('Error al verificar el dispositivo:', error);
        localStorage.removeItem('device-token'); // Limpiar token inválido
        setEstado('error_verificacion');
      }
    };

    verificarDispositivo();
  }, []);

  if (estado === 'aprobado') {
    return children;
  }

  const renderStatus = (icon, title, message) => (
    <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
          {icon}
        </div>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-2 text-slate-400">{message}</p>
      </div>
    </div>
  );

  if (estado === 'cargando') {
    return renderStatus(<LoaderCircle className="animate-spin text-cyan-400" size={32} />, 'Verificando dispositivo...', 'Por favor, espera un momento.');
  }

  if (estado === 'pendiente') {
    return renderStatus(<ShieldAlert className="text-yellow-400" size={32} />, 'Dispositivo pendiente', 'Este dispositivo necesita ser aprobado por un administrador.');
  }

  if (estado === 'rechazado') {
    return renderStatus(<ShieldAlert className="text-red-400" size={32} />, 'Dispositivo rechazado', 'El acceso desde este dispositivo ha sido denegado.');
  }

  return renderStatus(<ShieldAlert className="text-red-400" size={32} />, 'Error de dispositivo', 'No se pudo verificar este dispositivo. Contacta al administrador.');
}
import { useState } from 'react';
import { LoaderCircle, ShieldAlert, LockKeyhole, RefreshCw } from 'lucide-react';
import { useDevice } from '../context/DeviceContext';

/**
 * DeviceCheck — guardián único de acceso por dispositivo.
 *
 * Solo renderiza `children` cuando estado === 'aprobado'.
 * Para cualquier otro estado muestra el UI correspondiente.
 * No hace ninguna verificación propia: lee exclusivamente del DeviceContext.
 */
export function DeviceCheck({ children }) {
  const { estado, fingerprint, registrar, reintentar } = useDevice();
  const [nombreDispositivo, setNombreDispositivo] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [formError, setFormError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleRegistroSubmit = async (e) => {
    e.preventDefault();
    if (!nombreDispositivo.trim()) {
      setFormError('El nombre del dispositivo es obligatorio.');
      return;
    }
    if (!fingerprint) {
      setFormError('No se pudo identificar este dispositivo. Recarga la página.');
      return;
    }
    setFormError('');
    setEnviando(true);

    try {
      await registrar({
        nombre_dispositivo: nombreDispositivo,
        ubicacion,
      });
    } catch (error) {
      console.error('Error al registrar el dispositivo:', error);
      if (error.response && error.response.status === 409) {
        return;
      }
      setFormError('No se pudo enviar la solicitud. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  // ✅ Dispositivo aprobado: renderiza el contenido protegido
  if (estado === 'aprobado') {
    return children;
  }

  // Formulario de registro para dispositivos nuevos
  if (estado === 'mostrar_formulario') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <LockKeyhole className="text-cyan-400" size={32} />
          </div>
          <h1 className="text-2xl font-semibold text-white">Registro de Dispositivo</h1>
          <p className="mt-2 mb-6 text-slate-400">Este dispositivo no está autorizado. Por favor, identifícalo para solicitar acceso.</p>
          <form onSubmit={handleRegistroSubmit} className="text-left space-y-4">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-slate-300 mb-1">Nombre del dispositivo</label>
              <input
                type="text"
                id="nombre"
                value={nombreDispositivo}
                onChange={(e) => setNombreDispositivo(e.target.value)}
                className="w-full bg-white/5 p-2 rounded-md border border-slate-700 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Ej: Tablet Recepción"
                required
              />
            </div>
            <div>
              <label htmlFor="ubicacion" className="block text-sm font-medium text-slate-300 mb-1">Ubicación (opcional)</label>
              <input
                type="text"
                id="ubicacion"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                className="w-full bg-white/5 p-2 rounded-md border border-slate-700 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Ej: Entrada principal"
              />
            </div>
            {formError && <p className="text-red-400 text-sm">{formError}</p>}
            <button type="submit" disabled={enviando} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50">
              {enviando ? 'Enviando...' : 'Solicitar Autorización'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const renderStatus = (icon, title, message, action = null) => (
    <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
          {icon}
        </div>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-2 text-slate-400">{message}</p>
        {action}
      </div>
    </div>
  );

  if (estado === 'cargando') {
    return renderStatus(
      <LoaderCircle className="animate-spin text-cyan-400" size={32} />,
      'Verificando dispositivo...',
      'Por favor, espera un momento.',
    );
  }

  if (estado === 'pendiente') {
    return renderStatus(
      <ShieldAlert className="text-yellow-400" size={32} />,
      'Solicitud Enviada',
      'Este dispositivo necesita ser aprobado por un administrador para poder continuar.',
    );
  }

  if (estado === 'rechazado') {
    return renderStatus(
      <ShieldAlert className="text-red-400" size={32} />,
      'Dispositivo rechazado',
      'El acceso desde este dispositivo ha sido denegado.',
    );
  }

  // Estado: 'error_verificacion' u cualquier estado desconocido.
  // Nunca dejar al usuario en pantalla en blanco: mostrar error con opción de reintento.
  return renderStatus(
    <ShieldAlert className="text-red-400" size={32} />,
    'Error de Verificación',
    'No se pudo conectar con el servidor para verificar este dispositivo.',
    reintentar && (
      <button
        onClick={reintentar}
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
      >
        <RefreshCw size={16} />
        Reintentar
      </button>
    ),
  );
}

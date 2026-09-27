import { cloneElement, useCallback, useState, useEffect } from 'react';
import { LoaderCircle, ShieldAlert, LockKeyhole } from 'lucide-react';
import { useDevice } from '../context/DeviceContext';
import {
  getFingerprint,
  getDeviceTokenFromDB,
  saveDeviceTokenToDB,
  clearDeviceTokenFromDB,
  verifyDeviceToken,
  registerDevice,
  checkDeviceStatusByFingerprint,
  claimDeviceToken,
} from '../services/device';

export function DeviceCheck({ children }) {
  const [estado, setEstado] = useState('cargando'); // cargando, aprobado, pendiente, rechazado, error_verificacion, mostrar_formulario
  const [deviceTipo, setDeviceTipo] = useState(null);
  const [fingerprint, setFingerprint] = useState(null);
  const [nombreDispositivo, setNombreDispositivo] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [formError, setFormError] = useState('');
  const { setTipo, setCargando } = useDevice();

  const guardarTipo = useCallback((tipo) => {
    if (tipo !== 'kiosco' && tipo !== 'administracion') {
      throw new Error('El servidor no devolvió un tipo de dispositivo válido.');
    }
    const tipoActual = tipo;
    setDeviceTipo(tipoActual);
    setTipo(tipoActual);
    return tipoActual;
  }, [setTipo]);

  useEffect(() => {
    let activo = true;

    const verificarDispositivo = async () => {
      try {
        const fp = await getFingerprint();
        if (!activo) return;
        setFingerprint(fp);

        const token = await getDeviceTokenFromDB();
        if (!activo) return;

        if (token) {
          // El interceptor de API ya adjunta el token, así que no necesitamos pasarlo aquí.
          const data = await verifyDeviceToken();

          if (data.estado === 'aprobado') {
            // Guarda también el tipo aunque el token no haya cambiado.
            const tipoActual = guardarTipo(data.tipo);
            await saveDeviceTokenToDB(data.token || token, tipoActual);
            if (activo) setEstado('aprobado');
          } else {
            // Si el token no es válido (p. ej. el admin lo rechazó después), lo limpiamos
            // y volvemos a verificar el estado por fingerprint para mostrar el mensaje correcto.
            await clearDeviceTokenFromDB();
            const statusData = await checkDeviceStatusByFingerprint(fp);
            if (statusData.estado === 'pendiente' || statusData.estado === 'rechazado') {
                if (activo) setEstado(statusData.estado);
            } else {
                if (activo) setEstado('mostrar_formulario');
            }
          }
        } else {
          // No hay token, consultamos el estado por fingerprint antes de mostrar el formulario.
            const statusData = await checkDeviceStatusByFingerprint(fp);

            if (statusData.estado === 'aprobado') {
                // ¡Está aprobado! Reclamamos el token que el admin generó.
                try {
                    const claimData = await claimDeviceToken(fp);
                    const tipoActual = guardarTipo(claimData.tipo || statusData.tipo);
                    const tokenReclamado = claimData.token;
                    await saveDeviceTokenToDB(tokenReclamado, tipoActual);
                    if (activo) setEstado('aprobado');
                } catch (claimError) {
                    console.error('Error al reclamar el token:', claimError);
                    // Si falla el reclamo, es un error grave.
                    if (activo) setEstado('error_verificacion');
                }
            } else if (statusData.estado === 'pendiente' || statusData.estado === 'rechazado') {
                if (activo) setEstado(statusData.estado);
            } else { // 'no_encontrado'
                if (activo) setEstado('mostrar_formulario');
            }
        }
      } catch (error) {
        console.error('Error al verificar el dispositivo:', error);
        await clearDeviceTokenFromDB();
        if (activo) setEstado('error_verificacion');
      } finally {
        if (activo) setCargando(false);
      }
    };

    verificarDispositivo();

    return () => { activo = false; };
  }, [guardarTipo, setCargando]);

  const handleRegistroSubmit = async (e) => {
    e.preventDefault();
    if (!nombreDispositivo.trim()) {
      setFormError('El nombre del dispositivo es obligatorio.');
      return;
    }
    setFormError('');
    setEstado('cargando');

    try {
      await registerDevice({
        fingerprint,
        nombre_dispositivo: nombreDispositivo,
        ubicacion,
      });
      // Después de solicitar, el estado es 'pendiente' hasta que un admin apruebe.
      setEstado('pendiente');
    } catch (error) {
      console.error('Error al registrar el dispositivo:', error);
      // "Candado": Si el backend nos dice que ya está pendiente (409),
      // simplemente mostramos el estado 'pendiente' en la UI.
      if (error.response && error.response.status === 409) {
        setEstado('pendiente');
      } else {
        setEstado('error_registro');
      }
    }
  };

  if (estado === 'aprobado') {
    return cloneElement(children, { deviceTipo });
  }

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
            <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition-colors">Solicitar Autorización</button>
          </form>
        </div>
      </div>
    );
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
    return renderStatus(<ShieldAlert className="text-yellow-400" size={32} />, 'Solicitud Enviada', 'Este dispositivo necesita ser aprobado por un administrador para poder continuar.');
  }

  if (estado === 'rechazado') {
    return renderStatus(<ShieldAlert className="text-red-400" size={32} />, 'Dispositivo rechazado', 'El acceso desde este dispositivo ha sido denegado.');
  }

  return renderStatus(<ShieldAlert className="text-red-400" size={32} />, 'Error de Dispositivo', 'No se pudo verificar este dispositivo. Contacta al administrador.');
}
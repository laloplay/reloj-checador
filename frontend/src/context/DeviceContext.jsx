/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { registerDevice, resolveDeviceAccess } from '../services/device';

export const DeviceContext = createContext({
  tipo: null,
  estado: 'cargando',
  fingerprint: null,
  cargando: true,
  registrar: async () => {},
  reintentar: () => {},
});

/**
 * DeviceProvider — única fuente de verdad del estado del dispositivo.
 *
 * Responsabilidades:
 *  - Llamar a resolveDeviceAccess() UNA sola vez al montar.
 *  - Exponer `reintentar` para que DeviceCheck pueda forzar una nueva verificación
 *    después de un error de red.
 *  - Exponer `registrar` para que DeviceCheck pueda solicitar autorización.
 *
 * NO verifica el token por separado. NO hace polling. NO toma decisiones de navegación.
 * La UI y las redirecciones son responsabilidad de DeviceCheck y PrivateRoute.
 */
export function DeviceProvider({ children }) {
  const [tipo, setTipo] = useState(null);
  const [estado, setEstado] = useState('cargando');
  const [fingerprint, setFingerprint] = useState(null);
  // Contador que, al incrementarse, dispara el useEffect de verificación de nuevo.
  const [verificacionKey, setVerificacionKey] = useState(0);

  useEffect(() => {
    let activo = true;

    // Restablecemos a 'cargando' antes de cada intento (incluyendo reintentos)
    setEstado('cargando');
    setTipo(null);

    const verificarDispositivo = async () => {
      try {
        const resultado = await resolveDeviceAccess();
        if (!activo) return;
        setFingerprint(resultado.fingerprint);
        setTipo(resultado.tipo);
        setEstado(resultado.estado);
      } catch (error) {
        console.error('Error al verificar el dispositivo:', error);
        if (!activo) return;
        setEstado('error_verificacion');
      }
    };

    verificarDispositivo();

    return () => {
      activo = false;
    };
  }, [verificacionKey]);

  /**
   * Fuerza una nueva verificación completa del dispositivo.
   * Llamado por DeviceCheck cuando el usuario pulsa "Reintentar".
   */
  const reintentar = useCallback(() => {
    setVerificacionKey((k) => k + 1);
  }, []);

  const registrar = useCallback(async ({ nombre_dispositivo, ubicacion }) => {
    try {
      await registerDevice({
        fingerprint,
        nombre_dispositivo,
        ubicacion,
      });
      setEstado('pendiente');
    } catch (error) {
      if (error.response && error.response.status === 409) {
        setEstado('pendiente');
        return;
      }
      throw error;
    }
  }, [fingerprint]);

  const value = {
    tipo,
    estado,
    fingerprint,
    cargando: estado === 'cargando',
    registrar,
    reintentar,
  };

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevice() {
  return useContext(DeviceContext);
}

/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { registerDevice, resolveDeviceAccess } from '../services/device';

export const DeviceContext = createContext({
  tipo: null,
  estado: 'cargando',
  fingerprint: null,
  cargando: true,
  registrar: async () => {},
});

export function DeviceProvider({ children }) {
  const [tipo, setTipo] = useState(null);
  const [estado, setEstado] = useState('cargando');
  const [fingerprint, setFingerprint] = useState(null);

  useEffect(() => {
    let activo = true;

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
  };

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevice() {
  return useContext(DeviceContext);
}

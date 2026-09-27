/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { verifyDeviceToken } from '../services/device';

export const DeviceContext = createContext({ tipo: null, cargando: true });

export function DeviceProvider({ children }) {
  const [tipo, setTipo] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    async function sincronizarDispositivo() {
      try {
        const data = await verifyDeviceToken();
        // Solo una respuesta exitosa del servidor puede decidir el tipo de ruta.
        if (activo && data?.tipo) {
          setTipo(data.tipo);
        }
      } catch {
        console.error("Sincronización silenciosa falló");
      }

      if (activo) {
        setCargando(false);
      }
    }

    sincronizarDispositivo();

    return () => { activo = false; };
  }, []);

  return <DeviceContext.Provider value={{ tipo, setTipo, cargando }}>{children}</DeviceContext.Provider>;
}

export function useDevice() {
  return useContext(DeviceContext);
}
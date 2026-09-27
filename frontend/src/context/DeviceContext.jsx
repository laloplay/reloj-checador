/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { verifyDeviceToken } from '../services/device';

export const DeviceContext = createContext({ tipo: null, cargando: true });

export function DeviceProvider({ children }) {
  const [tipo, setTipo] = useState(null);
  const [cargando, setCargando] = useState(true);

  const verificar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await verifyDeviceToken();
      if (data?.tipo === 'kiosco' || data?.tipo === 'administracion') {
        setTipo(data.tipo);
      } else {
        setTipo(null);
      }
      return data;
    } catch {
      setTipo(null);
      return null;
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let activo = true;

    async function sincronizarDispositivo() {
      try {
        const data = await verificar();
        if (activo && data?.tipo !== 'kiosco' && data?.tipo !== 'administracion') {
          setTipo(null);
        }
      } catch {
        console.error("Sincronización silenciosa falló");
      }
    }

    sincronizarDispositivo();

    return () => { activo = false; };
  }, [verificar]);

  return <DeviceContext.Provider value={{ tipo, setTipo, cargando, verificar }}>{children}</DeviceContext.Provider>;
}

export function useDevice() {
  return useContext(DeviceContext);
}
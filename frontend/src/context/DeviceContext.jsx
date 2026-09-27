import { createContext, useContext, useEffect, useState } from 'react';
import { getDeviceTipo, verifyDeviceToken } from '../services/device'; // IMPORTANTE: Importa verifyDeviceToken

export const DeviceContext = createContext({ tipo: null, cargando: true });

export function DeviceProvider({ children }) {
  const [tipo, setTipo] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    async function sincronizarDispositivo() {
      // La memoria local solo sirve como pista mientras termina la verificación.
      const tipoGuardado = await getDeviceTipo();
      if (activo && tipoGuardado) {
        setTipo(tipoGuardado);
      }

      try {
        const data = await verifyDeviceToken();
        // El servidor es la fuente de verdad y actualiza también cambios hechos en la BD.
        if (activo && data?.tipo) {
          setTipo(data.tipo);
        } else if (activo && data?.estado === 'rechazado') {
          // Evita que un tipo local obsoleto bloquee la recuperación por fingerprint.
          setTipo(null);
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
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { getDeviceTipo } from '../services/device';

export const DeviceContext = createContext({ tipo: 'kiosco', cargando: true });

export function DeviceProvider({ children }) {
  const [tipo, setTipo] = useState('kiosco');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    getDeviceTipo().then((tipoGuardado) => {
      if (activo && tipoGuardado) {
        setTipo(tipoGuardado);
      }
      if (activo) {
        setCargando(false);
      }
    });

    return () => {
      activo = false;
    };
  }, []);

  return <DeviceContext.Provider value={{ tipo, setTipo, cargando }}>{children}</DeviceContext.Provider>;
}

export function useDevice() {
  return useContext(DeviceContext);
}
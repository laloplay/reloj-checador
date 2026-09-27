/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

export const DeviceContext = createContext({
  tipo: null,
  setTipo: () => {},
  cargando: true,
  setCargando: () => {},
});

export function DeviceProvider({ children }) {
  const [tipo, setTipo] = useState(null);
  const [cargando, setCargando] = useState(true);

  return <DeviceContext.Provider value={{ tipo, setTipo, cargando, setCargando }}>{children}</DeviceContext.Provider>;
}

export function useDevice() {
  return useContext(DeviceContext);
}
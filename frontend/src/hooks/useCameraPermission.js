import { useState, useEffect, useCallback } from 'react';

export function useCameraPermission() {
  const [permission, setPermission] = useState('cargando'); // cargando, prompt, granted, denied

  const checkPermission = useCallback(async () => {
    // La API de permisos no es soportada en todos los navegadores (ej. algunos modos de Safari)
    if (!navigator.permissions || !navigator.permissions.query) {
      // Si no podemos consultar, asumimos que necesitamos pedirlo.
      setPermission('prompt');
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: 'camera' });
      setPermission(result.state); // 'granted', 'denied', o 'prompt'
      
      // Escuchamos por si el usuario cambia el permiso desde la configuración del navegador
      result.onchange = () => {
        setPermission(result.state);
      };
    } catch (error) {
      console.error("Error al consultar permiso de cámara:", error);
      setPermission('prompt'); // Como fallback, asumimos que debemos preguntar
    }
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const requestPermission = useCallback(async () => {
    if (permission !== 'granted') {
      try {
        // Esto dispara el pop-up del navegador para pedir permiso
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Si llegamos aquí, el usuario aceptó. Detenemos el stream porque solo queríamos el permiso.
        stream.getTracks().forEach(track => track.stop());
        setPermission('granted'); // Actualizamos el estado manualmente
        return 'granted';
      } catch (err) {
        // El usuario denegó el permiso
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermission('denied');
          return 'denied';
        }
        console.error("Error al solicitar acceso a la cámara:", err);
        return 'error';
      }
    }
    return 'granted';
  }, [permission]);

  return { permission, requestPermission };
}
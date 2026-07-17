import FingerprintJS from '@fingerprintjs/fingerprintjs';
import api from './api';

async function getPublicIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.ip || null;
  } catch (error) {
    console.warn('No se pudo obtener IP pública:', error);
    return null;
  }
}

export async function getOrCreateDeviceToken() {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  const fingerprint = result.visitorId;

  let token = localStorage.getItem('device-token');
  if (token) {
    try {
      const response = await api.get('/dispositivos/verificar');
      return { fingerprint, token, estado: response.data?.estado || null };
    } catch (error) {
      localStorage.removeItem('device-token');
      token = null;
    }
  }

  // Si no hay token, registrar el dispositivo
  const navegador = (navigator.userAgent || 'unknown').substring(0, 90);
  const ip = await getPublicIP();

  const response = await api.post('/dispositivos/registrar', {
    fingerprint,
    nombre: navegador,
    ip,
    navegador,
  });
  
  token = response.data?.token;
  const estado = response.data?.estado || null;

  if (token) {
    localStorage.setItem('device-token', token);
  }

  return { fingerprint, token, estado };
}

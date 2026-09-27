import FingerprintJS from '@fingerprintjs/fingerprintjs';
import api from './api';
import { get, set, del } from './indexedDB';

const DEVICE_TOKEN_KEY = 'device-jwt';
const DEVICE_TYPE_KEY = 'device-tipo';

/**
 * Genera un fingerprint único del navegador.
 */
export async function getFingerprint() {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  return result.visitorId;
}

/**
 * Lee el token del dispositivo desde IndexedDB.
 */
export function getDeviceTokenFromDB() {
  return get(DEVICE_TOKEN_KEY);
}

/**
 * Guarda el token del dispositivo en IndexedDB.
 */
export async function saveDeviceTokenToDB(token, tipo = 'kiosco') {
  await set(DEVICE_TOKEN_KEY, token);
  await set(DEVICE_TYPE_KEY, tipo || 'kiosco');
}

/**
 * Lee el tipo de dispositivo desde IndexedDB.
 */
export function getDeviceTipo() {
  return get(DEVICE_TYPE_KEY);
}

/**
 * Elimina el token del dispositivo de IndexedDB.
 */
export function clearDeviceTokenFromDB() {
  return del(DEVICE_TOKEN_KEY);
}

/**
 * Verifica el token del dispositivo con el backend.
 * El backend puede devolver un token nuevo si el antiguo expiró.
 */
export async function verifyDeviceToken() {
  try {
    const { data } = await api.get('/dispositivos/verificar');
    
    // 1. AUTO-SINCRONIZACIÓN: Si el servidor responde con éxito, actualizamos IndexedDB
    // Esto asegura que si lo cambiaste a 'administracion' en la BD, el navegador lo detecte y se actualice solo.
    if (data.estado === 'aprobado' && data.tipo) {
      await saveDeviceTokenToDB(data.token || getDeviceTokenFromDB(), data.tipo);
    }
    
    return data;
  } catch (error) {
    
    if (error.response && (error.response.status === 401 || error.response.status === 403 || error.response.status === 404)) {
      console.warn("Dispositivo rechazado o atascado. Limpiando memoria automáticamente...");
      await clearDeviceTokenFromDB(); // Borra el token
      await del(DEVICE_TYPE_KEY);     // Borra el rol viejo
    }
    
    return error.response?.data || { estado: 'error_verificacion' };
  }
}

/**
 * Registra un nuevo dispositivo para solicitar autorización.
 */
export async function registerDevice({ fingerprint, nombre_dispositivo, ubicacion }) {
  const { data } = await api.post('/dispositivos/registrar', {
    fingerprint,
    nombre_dispositivo,
    ubicacion,
  });
  return data;
}

/**
 * Consulta el estado de un dispositivo usando su fingerprint.
 * Útil para cuando el dispositivo aún no tiene un token.
 */
export async function checkDeviceStatusByFingerprint(fingerprint) {
  try {
    const { data } = await api.get(`/dispositivos/status/${fingerprint}`);
    return data; // { estado: 'pendiente' | 'aprobado' | 'rechazado' }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return { estado: 'no_encontrado' };
    }
    throw error;
  }
}


export async function claimDeviceToken(fingerprint) {
  try {
    const { data } = await api.post('/dispositivos/claim-token', { fingerprint });
    
    // Auto-sincronización al momento de obtener el token por primera vez
    if (data.token && data.tipo) {
      await saveDeviceTokenToDB(data.token, data.tipo);
    }
    
    return data; 
  } catch (error) {
    // Si da error 403 al reclamar (como nos pasaba antes), borramos el caché corrupto
    if (error.response && error.response.status === 403) {
      await clearDeviceTokenFromDB();
      await del(DEVICE_TYPE_KEY);
    }
    throw error;
  }
}

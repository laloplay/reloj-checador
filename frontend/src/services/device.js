import FingerprintJS from '@fingerprintjs/fingerprintjs';
import api from './api';
import { get, set, del } from './indexedDB';

const DEVICE_TOKEN_KEY = 'device-jwt';

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
export function saveDeviceTokenToDB(token) {
  return set(DEVICE_TOKEN_KEY, token);
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
    return data; // { estado, token, message? }
  } catch (error) {
    // El interceptor de axios puede no manejar bien los errores 4xx
    // Devolvemos el estado del error si está disponible
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

/**
 * Reclama el token para un dispositivo que ya ha sido aprobado.
 */
export async function claimDeviceToken(fingerprint) {
  const { data } = await api.post('/dispositivos/claim-token', { fingerprint });
  return data; // { token: '...' }
}

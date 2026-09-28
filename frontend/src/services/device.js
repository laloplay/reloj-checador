import FingerprintJS from '@fingerprintjs/fingerprintjs';
import api from './api';
import { get, set, del } from './indexedDB';

const DEVICE_TOKEN_KEY = 'device-jwt';
const DEVICE_TYPE_KEY = 'device-tipo';

function esTipoValido(tipo) {
  return tipo === 'kiosco' || tipo === 'administracion';
}

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
 * Nunca asume kiosco: un default falso es lo que expulsaba al admin al checador.
 */
export async function saveDeviceTokenToDB(token, tipo) {
  if (token) {
    await set(DEVICE_TOKEN_KEY, token);
  }
  if (esTipoValido(tipo)) {
    await set(DEVICE_TYPE_KEY, tipo);
  }
}

/**
 * Lee el tipo de dispositivo desde IndexedDB.
 */
export function getDeviceTipo() {
  return get(DEVICE_TYPE_KEY);
}

/**
 * Elimina el token y el tipo del dispositivo de IndexedDB.
 */
export async function clearDeviceTokenFromDB() {
  await del(DEVICE_TOKEN_KEY);
  await del(DEVICE_TYPE_KEY);
}

/**
 * Verifica el token del dispositivo con el backend.
 * El backend puede devolver un token nuevo si el antiguo expiró.
 */
export async function verifyDeviceToken() {
  try {
    const { data } = await api.get('/dispositivos/verificar');
    if (esTipoValido(data.tipo)) {
      const tokenActual = data.token || await getDeviceTokenFromDB();
      await saveDeviceTokenToDB(tokenActual, data.tipo);
    }
    return data;
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 403 || error.response.status === 404)) {
      console.warn('Dispositivo rechazado o atascado. Limpiando memoria automáticamente...');
      await clearDeviceTokenFromDB();
      return error.response.data || { estado: 'rechazado' };
    }
    throw error;
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
    return data;
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

    if (data.token && esTipoValido(data.tipo)) {
      await saveDeviceTokenToDB(data.token, data.tipo);
    }

    return data;
  } catch (error) {
    if (error.response && error.response.status === 403) {
      await clearDeviceTokenFromDB();
    }
    throw error;
  }
}

/**
 * Resuelve el acceso del dispositivo contra el servidor.
 * El tipo en IndexedDB nunca decide la ruta: solo se usa el valor del backend.
 */
export async function resolveDeviceAccess() {
  const fingerprint = await getFingerprint();
  const token = await getDeviceTokenFromDB();

  if (token) {
    const data = await verifyDeviceToken();

    if (data.estado === 'aprobado' && esTipoValido(data.tipo)) {
      await saveDeviceTokenToDB(data.token || token, data.tipo);
      return { estado: 'aprobado', tipo: data.tipo, fingerprint };
    }

    const statusData = await checkDeviceStatusByFingerprint(fingerprint);
    return continuarSinToken(fingerprint, statusData);
  }

  const statusData = await checkDeviceStatusByFingerprint(fingerprint);
  return continuarSinToken(fingerprint, statusData);
}

async function continuarSinToken(fingerprint, statusData) {
  if (statusData.estado === 'aprobado') {
    const claimData = await claimDeviceToken(fingerprint);
    const tipo = claimData.tipo || statusData.tipo;
    if (!esTipoValido(tipo) || !claimData.token) {
      return { estado: 'error_verificacion', tipo: null, fingerprint };
    }
    await saveDeviceTokenToDB(claimData.token, tipo);
    return { estado: 'aprobado', tipo, fingerprint };
  }

  if (statusData.estado === 'pendiente' || statusData.estado === 'rechazado') {
    return { estado: statusData.estado, tipo: null, fingerprint };
  }

  return { estado: 'mostrar_formulario', tipo: null, fingerprint };
}

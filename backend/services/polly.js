const fs = require('fs');
const path = require('path');

let PollyClient;
let SynthesizeSpeechCommand;

try {
  const awsPolly = require('@aws-sdk/client-polly');
  PollyClient = awsPolly.PollyClient;
  SynthesizeSpeechCommand = awsPolly.SynthesizeSpeechCommand;
} catch (error) {
  PollyClient = null;
  SynthesizeSpeechCommand = null;
}

const AUDIO_CACHE_DIR = path.join(__dirname, '..', 'audio-cache');

if (!fs.existsSync(AUDIO_CACHE_DIR)) {
  fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true });
}

const pollyClient = PollyClient && new PollyClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN || undefined,
  } : undefined,
});

let pollyDisabledByPolicy = false;

function isPollyAvailable() {
  return Boolean(pollyClient && SynthesizeSpeechCommand && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

function normalizarPrimerNombre(nombreCompleto) {
  if (!nombreCompleto || typeof nombreCompleto !== 'string') return 'Usuario';
  const primerNombre = nombreCompleto.trim().split(/\s+/)[0] || 'Usuario';
  return primerNombre.charAt(0).toUpperCase() + primerNombre.slice(1).toLowerCase();
}

async function generarAudioMp3({ empleadoId, tipo, texto }) {
  if (!isPollyAvailable() || pollyDisabledByPolicy) {
    return null;
  }

  const command = new SynthesizeSpeechCommand({
    Engine: 'neural',
    LanguageCode: 'es-US',
    VoiceId: 'Pedro',
    OutputFormat: 'mp3',
    Text: texto,
  });

  let response;
  try {
    response = await pollyClient.send(command);
  } catch (error) {
    if (error?.name === 'AccessDeniedException') {
      pollyDisabledByPolicy = true;
      const policyError = new Error('AWS Polly no autorizado: falta permiso polly:SynthesizeSpeech en IAM.');
      policyError.code = 'POLLY_ACCESS_DENIED';
      throw policyError;
    }
    throw error;
  }

  const audioBuffer = response.AudioStream instanceof Uint8Array
    ? Buffer.from(response.AudioStream)
    : Buffer.from(await response.AudioStream?.transformToByteArray?.() || []);

  const filePath = path.join(AUDIO_CACHE_DIR, `${empleadoId}_${tipo}.mp3`);
  fs.writeFileSync(filePath, audioBuffer);
  return filePath;
}

async function generarAudiosEmpleado(empleado) {
  if (!empleado || !empleado.id) {
    throw new Error('Se requiere un empleado con un id válido para generar audios');
  }

  if (!isPollyAvailable()) {
    console.warn('AWS Polly no disponible; se omite la generación de audios para el empleado.', empleado.id);
    return [];
  }

  if (pollyDisabledByPolicy) {
    console.warn('AWS Polly deshabilitado por permisos IAM; se omite la generación de audios para el empleado.', empleado.id);
    return [];
  }

  const primerNombre = normalizarPrimerNombre(empleado.nombre_completo);
  const mensajes = [
    {
      tipo: 'entrada_puntual',
      texto: `Bienvenido ${primerNombre}, tu entrada ha sido registrada correctamente`,
    },
    {
      tipo: 'entrada_retardo',
      texto: `${primerNombre}, tu entrada ha sido registrada, recuerda llegar puntual`,
    },
    {
      tipo: 'salida',
      texto: `Hasta luego ${primerNombre}, que tengas un excelente día`,
    },
  ];

  const resultados = [];
  for (const mensaje of mensajes) {
    const filePath = await generarAudioMp3({
      empleadoId: empleado.id,
      tipo: mensaje.tipo,
      texto: mensaje.texto,
    });

    if (filePath) {
      resultados.push(filePath);
    }
  }

  return resultados;
}

function obtenerRutaAudio(empleadoId, tipo) {
  if (!empleadoId || !tipo) return null;
  const filePath = path.join(AUDIO_CACHE_DIR, `${empleadoId}_${tipo}.mp3`);
  return fs.existsSync(filePath) ? filePath : null;
}

function eliminarAudiosEmpleado(empleadoId) {
  if (!empleadoId) return Promise.resolve([]);

  const tipos = ['entrada_puntual', 'entrada_retardo', 'salida'];
  const eliminados = tipos
    .map((tipo) => ({ tipo, ruta: path.join(AUDIO_CACHE_DIR, `${empleadoId}_${tipo}.mp3`) }))
    .filter(({ ruta }) => fs.existsSync(ruta))
    .map(({ ruta }) => {
      fs.unlinkSync(ruta);
      return ruta;
    });

  return Promise.resolve(eliminados);
}

module.exports = {
  generarAudiosEmpleado,
  obtenerRutaAudio,
  eliminarAudiosEmpleado,
};

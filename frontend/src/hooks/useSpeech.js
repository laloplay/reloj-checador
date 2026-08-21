export function useSpeech() {
  let audioDesbloqueado = false;

  const reproducirDesdeUrl = async (url) => {
    if (!url) return false;

    try {
      const audio = new Audio(url);
      audio.volume = 1;
      await audio.play();
      return true;
    } catch (error) {
      console.warn('No se pudo reproducir el audio:', error);
      return false;
    }
  };

  const desbloquearAudio = async () => {
    if (audioDesbloqueado) return true;

    try {
      const audio = new Audio();
      audio.muted = true;
      audio.volume = 0;
      await audio.play();
      audio.pause();
      audioDesbloqueado = true;
      return true;
    } catch (error) {
      return false;
    }
  };

  const reproducirTexto = (mensaje) => {
    if (!('speechSynthesis' in window)) return;

    try {
      const utterance = new SpeechSynthesisUtterance(mensaje);
      utterance.lang = 'es-MX';
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn('No se pudo usar SpeechSynthesis:', error);
    }
  };

  const reproducirChecada = async (audioUrl, mensajeFallback = 'Tu asistencia ha sido registrada') => {
    if (audioUrl) {
      // 1. Asegurarnos de que la ruta lleve el prefijo /api para Nginx
      let rutaAudio = audioUrl;
      if (rutaAudio.startsWith('/audio')) {
        rutaAudio = `/api${rutaAudio}`;
      }

      // 2. Aplicamos la lógica dinámica: localhost en Mac, ruta relativa en Ubuntu
      const urlCompleta = import.meta.env.DEV 
        ? `http://localhost:3001${rutaAudio}` 
        : rutaAudio;

      const ok = await reproducirDesdeUrl(urlCompleta);

      if (ok) {
        return;
      }
    }

    reproducirTexto(mensajeFallback);
  };

  return { reproducirChecada, reproducirTexto, desbloquearAudio };
}
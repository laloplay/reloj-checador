const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useSpeech() {
  const reproducirDesdeUrl = (url) => {
    if (!url) return null;

    try {
      const audio = new Audio(url);
      audio.volume = 1;
      audio.play().catch(() => {});
      return audio;
    } catch (error) {
      console.warn('No se pudo reproducir el audio:', error);
      return null;
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

  const reproducirChecada = (audioUrl, mensajeFallback = 'Tu asistencia ha sido registrada') => {
    if (audioUrl) {
      const urlCompleta = `${BASE_URL}${audioUrl}`;
      reproducirDesdeUrl(urlCompleta);
      return;
    }

    reproducirTexto(mensajeFallback);
  };

  return { reproducirChecada, reproducirTexto };
}

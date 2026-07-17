import { useEffect, useState } from 'react';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DIAS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

function formatHora(date) {
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  const segundos = String(date.getSeconds()).padStart(2, '0');
  return `${horas}:${minutos}:${segundos}`;
}

function formatFecha(date) {
  const dia = DIAS[date.getDay()];
  const dia_numero = String(date.getDate()).padStart(2, '0');
  const mes = MESES[date.getMonth()];
  const año = date.getFullYear();
  return `${dia} ${dia_numero} de ${mes} ${año}`;
}

export function useClock() {
  const [hora, setHora] = useState(() => formatHora(new Date()));
  const [fecha, setFecha] = useState(() => formatFecha(new Date()));

  useEffect(() => {
    const interval = setInterval(() => {
      const ahora = new Date();
      setHora(formatHora(ahora));
      setFecha(formatFecha(ahora));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return { hora, fecha };
}

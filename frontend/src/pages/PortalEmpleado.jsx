import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, Calendar, Award, AlertTriangle, UserCheck,
  LogOut, ArrowLeft, LoaderCircle, AlertCircle, RefreshCw, MinusCircle, XCircle, CheckCircle2, Clock,
  CalendarDays, FileText, Plane, Gift
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Logo } from '../components/Logo';

const CONDITION_COLOR_MAP = {
  puntual:    { label: 'Puntual',     icon: UserCheck,    styles: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300', color: '#34d399' },
  retardo:    { label: 'Retardo',     icon: AlertTriangle,styles: 'bg-amber-500/10 border-amber-500/20 text-amber-300',   color: '#f59e0b' },
  falta:      { label: 'Falta',       icon: MinusCircle,  styles: 'bg-rose-500/10 border-rose-500/20 text-rose-300',       color: '#f43f5e' },
  descanso:   { label: 'Descanso',    icon: Calendar,     styles: 'bg-blue-500/10 border-blue-500/20 text-blue-300',       color: '#3b82f6' },
  festivo:    { label: 'Día Festivo', icon: CalendarDays, styles: 'bg-purple-500/10 border-purple-500/20 text-purple-300', color: '#a855f7' },
  permiso:    { label: 'Permiso',     icon: FileText,     styles: 'bg-orange-500/10 border-orange-500/20 text-orange-300', color: '#f97316' },
  vacaciones: { label: 'Vacaciones',  icon: Plane,        styles: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300',       color: '#06b6d4' },
  cumpleanos: { label: '¡Felicidades!', icon: Gift,       styles: 'bg-pink-500/10 border-pink-500/20 text-pink-300',       color: '#ec4899' },
  futuro:     { label: 'Futuro',      icon: null,         styles: 'bg-white/5 border-white/10 text-slate-400',             color: '#64748b' },
};

const PortalHeader = () => (
  <header className="flex shrink-0 items-center justify-between gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 px-3 py-2.5 shadow-lg shadow-black/20 backdrop-blur-2xl sm:rounded-[1.75rem] sm:px-5 sm:py-3">
    <Logo className="h-auto w-32 lg:w-40 xl:w-44" />
    <Link
      to="/"
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2.5 text-xs font-medium text-slate-200 transition hover:bg-white/20 hover:text-white active:scale-95 touch-manipulation sm:text-sm"
    >
      <ArrowLeft size={16} />
      <span className="hidden sm:inline">Volver al inicio</span>
    </Link>
  </header>
);

const CamaraStep = ({ onConsultar, procesando, error, streamActivo, cameraError, videoRef, onRetryCamera }) => (
  <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_28px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:rounded-[1.75rem]">
    <div className="shrink-0 border-b border-white/5 p-4 sm:p-5 lg:p-6">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-cyan-100">
          <UserCheck size={12} />
          Verificación Facial
        </div>
        <h1 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl lg:text-5xl">Portal de Empleado</h1>
        <p className="mt-2 text-sm text-slate-400 sm:text-base lg:text-lg">Consulta tus asistencias y registros del mes.</p>
      </div>
    </div>

    <div className="relative flex-1 min-h-0 px-4 pb-4 mt-4 sm:px-5 sm:pb-5 sm:mt-5 lg:px-6 lg:pb-6 lg:mt-6">
      <div className="relative h-full w-full">
        <div className="absolute left-4 top-0 z-10 inline-flex -translate-y-1/2 items-center gap-2 rounded-full border border-white/10 bg-slate-950/80 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white/80 backdrop-blur-md sm:left-6 sm:text-[11px]">
          <span className="relative flex h-2 w-2">
            {streamActivo && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                streamActivo ? 'bg-emerald-400' : cameraError ? 'bg-rose-400' : 'bg-slate-500'
              }`}
            />
          </span>
          <Camera size={14} />
          {streamActivo ? 'Cámara activa' : cameraError ? 'Cámara no disponible' : 'Iniciando cámara'}
        </div>

        <div className="relative h-full min-h-50 overflow-hidden rounded-[1.25rem] border border-blue-400/20 bg-slate-950/60 shadow-2xl sm:rounded-3xl">
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover object-center" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_38%,rgba(2,6,23,0.45)_100%)]" />

          {/* Guía facial */}
          {!cameraError && streamActivo && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
              <div className="h-64 w-48 rounded-full border-2 border-dashed border-white sm:h-80 sm:w-64" />
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/92 px-6 text-center backdrop-blur-sm">
              <div>
                <AlertCircle className="mx-auto mb-3 text-rose-400" size={32} />
                <p className="mb-1 text-sm font-medium text-white sm:text-base">No se pudo acceder a la cámara</p>
                <p className="mb-4 text-xs text-slate-400 sm:text-sm">Revisa los permisos del navegador e inténtalo de nuevo.</p>
                <button
                  type="button"
                  onClick={onRetryCamera}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/20 active:scale-95 touch-manipulation"
                >
                  <RefreshCw size={14} />
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {!cameraError && !streamActivo && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
              <div className="text-center">
                <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-b-2 border-cyan-400" />
                <p className="text-sm text-slate-300">Iniciando cámara...</p>
              </div>
            </div>
          )}

          {procesando && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/72 backdrop-blur-sm">
              <div className="text-center">
                <div className="mx-auto mb-3 h-11 w-11 animate-spin rounded-full border-b-2 border-cyan-400" />
                <p className="text-sm tracking-wide text-white sm:text-base">Verificando identidad...</p>
              </div>
            </div>
          )}

          {error && !procesando && (
             <div className="absolute inset-0 flex items-center justify-center bg-rose-950/90 px-5 text-center backdrop-blur-md transition-all">
                <div>
                  <XCircle className="mx-auto mb-2 text-rose-400" size={36} />
                  <p className="text-sm font-semibold text-white sm:text-base">{error}</p>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
    <div className="shrink-0 border-t border-white/5 p-4 sm:p-5 lg:p-6">
      <div className="mx-auto flex max-w-sm justify-center">
        <button
          onClick={onConsultar}
          disabled={procesando || !streamActivo}
          className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-300/30 bg-blue-600 px-6 py-4 text-sm font-semibold tracking-wide text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:w-auto"
        >
          {procesando ? (
            <LoaderCircle className="animate-spin" size={18} />
          ) : (
            <Camera size={18} className="transition-transform group-hover:scale-110" />
          )}
          {procesando ? 'Verificando...' : 'Consultar mis registros'}
        </button>
      </div>
    </div>
  </section>
);

const BonoQuincenalCard = ({ titulo, periodo, status }) => {
  const config = {
    true: {
      fondo: 'bg-emerald-500/10 border-emerald-500/20',
      icono: <CheckCircle2 size={20} className="text-emerald-400" />,
      texto: 'Bono Válido ✓',
      textoColor: 'text-emerald-300'
    },
    false: {
      fondo: 'bg-rose-500/10 border-rose-500/20',
      icono: <XCircle size={20} className="text-rose-400" />,
      texto: 'Bono No Válido ✗',
      textoColor: 'text-rose-300'
    },
    null: {
      fondo: 'bg-white/5 border-white/10',
      icono: <Clock size={20} className="text-slate-400" />,
      texto: 'En Curso',
      textoColor: 'text-slate-300'
    }
  }[status];

  if (!config) return null;

  return (
    <div className={`rounded-2xl border p-4 ${config.fondo}`}>
      <div className="flex items-center justify-center gap-2">
        {config.icono}
        <p className={`font-semibold ${config.textoColor}`}>{config.texto}</p>
      </div>
      <p className="mt-1.5 text-center text-xs text-slate-400">{titulo} ({periodo})</p>
    </div>
  );
};

const DiaRow = ({ dia }) => {
  const [tooltipActivo, setTooltipActivo] = useState(null); // Guarda el índice de la condición

  const isFuture = dia.es_futuro;
  
  let rowBg;
  if (dia.asistencia_en_dia_no_laborable) {
    rowBg = 'bg-indigo-500/10 border-indigo-500/20';
  } else if (isFuture) {
    rowBg = 'bg-white/5 border-white/10';
  } else {
    rowBg = 'bg-white/[0.02] border-white/10';
  }

  const handleToggleTooltip = (index) => {
    setTooltipActivo(prev => (prev === index ? null : index));
  };

  return (
    <div className={`relative flex items-stretch gap-0 rounded-xl border ${tooltipActivo !== null ? 'z-20 overflow-visible' : 'z-0 overflow-hidden'} ${rowBg}`}>
      <div className="flex w-1.5 shrink-0 flex-col">
        {!isFuture && dia.condiciones.map((cond, index) => {
          const config = CONDITION_COLOR_MAP[cond.tipo];
          if (!config) return null;
          return <div key={index} className="flex-1" style={{ backgroundColor: config.color }} title={config.label} />;
        })}
      </div>
      <div className="flex grow items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="text-center w-10">
            <div className="font-bold text-lg text-white">{dia.dia_num}</div>
            <div className="text-xs capitalize text-slate-400">{dia.dia_semana.substring(0, 3)}</div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {isFuture ? <div className="text-sm text-slate-500">Día futuro</div> : dia.condiciones.map((cond, index) => {
              const config = CONDITION_COLOR_MAP[cond.tipo];
              if (!config) return null;
              const Icono = config.icon;
              const hasMotivo = ['permiso', 'vacaciones', 'descanso', 'festivo', 'cumpleanos'].includes(cond.tipo) && cond.motivo;
              return (
                <div key={index} title={hasMotivo ? '' : config.label} className={`relative flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${config.styles}`} onMouseEnter={hasMotivo ? () => setTooltipActivo(index) : undefined} onMouseLeave={hasMotivo ? () => setTooltipActivo(null) : undefined} onClick={hasMotivo ? () => handleToggleTooltip(index) : undefined}>
                  {Icono && <Icono size={14} />}
                  <span>{cond.label}</span>
                  {hasMotivo && tooltipActivo === index && (<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-48 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-md px-3 py-2 text-xs text-white shadow-xl"><p className="font-medium text-white/60 mb-1 uppercase tracking-wide text-[10px]">Motivo</p><p>{cond.motivo}</p><div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95" /></div>)}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          {dia.hora_entrada && (<div className="font-mono text-xs text-slate-400 sm:text-sm"><span>{dia.hora_entrada}</span><span className="mx-1.5 opacity-50">→</span><span>{dia.hora_salida || '--:--'}</span></div>)}
          {dia.tiene_bono && (<div className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-200"><Award size={14} /> Bono</div>)}
        </div>
      </div>
    </div>
  );
};

const ResumenStep = ({ data, onCerrar, segundos }) => {
  const { empleado, resumen } = data;

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 shadow-[0_28px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:rounded-[1.75rem]">
      {/* Header del Resumen */}
      <div className="flex shrink-0 flex-col justify-between gap-4 border-b border-white/5 bg-white/5 p-4 sm:flex-row sm:items-center sm:p-5 lg:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-500/10 shadow-inner sm:h-16 sm:w-16">
            <UserCheck className="text-cyan-300" size={28} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-white sm:text-2xl">{empleado.nombre_completo}</h2>
            <p className="truncate text-sm text-slate-300">
              {empleado.puesto_nombre || 'Sin puesto'} <span className="mx-1.5 text-white/20">•</span> {empleado.sucursal_nombre || 'Sin sucursal'}
            </p>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
          <button 
            onClick={onCerrar} 
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-white/10 active:scale-95 touch-manipulation sm:text-sm"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
          <span className="text-xs text-slate-400">Cierre automático en {segundos}s</span>
        </div>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-white/5 p-4 sm:p-5 lg:p-6 custom-scrollbar">
        <div className="mx-auto max-w-4xl space-y-6">
          <h3 className="text-center text-lg font-medium capitalize tracking-wide text-white sm:text-left sm:text-xl">
            Resumen de {resumen.mes}
          </h3>
          
          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {Object.entries({ 
              Asistencias: resumen.asistencias, 
              Retardos: resumen.retardos, 
              Faltas: resumen.faltas
            }).map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center sm:p-5">
                <p className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{value}</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400 sm:text-xs">{label}</p>
              </div>
            ))}
          </div>

          {/* Bonos Quincenales */}
          <div className="grid grid-cols-2 gap-3">
            <BonoQuincenalCard 
              titulo="1ra Quincena"
              periodo={`1 - 15 de ${resumen.mes.split(' ')[0]}`}
              status={resumen.bono_primera_quincena}
            />
            <BonoQuincenalCard 
              titulo="2da Quincena"
              periodo={`16 - Fin de ${resumen.mes.split(' ')[0]}`}
              status={resumen.bono_segunda_quincena}
            />
          </div>

          {/* Calendario / Lista de Días */}
          <div className="space-y-2">
            {resumen.dias.map((dia) => <DiaRow key={dia.fecha} dia={dia} />)}
          </div>
        </div>
      </div>
    </section>
  );
};

export function PortalEmpleado() {
  const [paso, setPaso] = useState('camara');
  const [procesando, setProcesando] = useState(false);
  const [empleadoData, setEmpleadoData] = useState(null);
  
  // Estados de cámara refactorizados para igualar a CheckIn
  const [streamActivo, setStreamActivo] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState(null);
  
  const [segundosRestantes, setSegundosRestantes] = useState(30);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  const iniciarCamara = useCallback(async () => {
    try {
      setCameraError(false);
      // Se utiliza una resolución similar al componente CheckIn
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStreamActivo(true);
      }
      streamRef.current = mediaStream;
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      setStreamActivo(false);
      setCameraError(true);
    }
  }, []);

  const detenerCamara = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStreamActivo(false);
  }, []);

  useEffect(() => {
    if (paso === 'camara') {
      iniciarCamara();
    } else {
      detenerCamara();
    }
    return () => detenerCamara();
  }, [paso, iniciarCamara, detenerCamara]);

  const handleCerrarSesion = useCallback(() => {
    setPaso('camara');
    setEmpleadoData(null);
    setErrorMensaje(null);
    clearInterval(timerRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    setSegundosRestantes(30);
  }, []);

  useEffect(() => {
    if (paso === 'resumen') {
      resetTimer();
      window.addEventListener('scroll', resetTimer, { passive: true });
      window.addEventListener('click', resetTimer);
      window.addEventListener('touchstart', resetTimer, { passive: true });

      timerRef.current = setInterval(() => {
        setSegundosRestantes(prev => {
          if (prev <= 1) {
            handleCerrarSesion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(timerRef.current);
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, [paso, resetTimer, handleCerrarSesion]);

  const capturarImagen = () => {
    if (!canvasRef.current || !videoRef.current || !streamActivo) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
  };

  const mostrarError = (msg) => {
    setErrorMensaje(msg);
    setTimeout(() => setErrorMensaje(null), 5000);
  };

  const handleConsultar = async () => {
    const imagenBase64 = capturarImagen();
    if (!imagenBase64) {
      mostrarError("No se pudo capturar la imagen. Intenta de nuevo.");
      return;
    }

    try {
      setProcesando(true);
      setErrorMensaje(null);
      const { data } = await api.post('/portal/consultar', { imagen: imagenBase64 });
      setEmpleadoData(data);
      setPaso('resumen');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'No se pudo verificar tu identidad.';
      mostrarError(errorMessage);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div 
      className="relative flex h-screen w-full select-none flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_25%),linear-gradient(180deg,#020617_0%,#07111f_60%,#020617_100%)] text-white [-webkit-tap-highlight-color:transparent]" 
      style={{ height: '100dvh' }}
    >
      {/* Background Blurs Opcionales / Atmosféricos */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-16 top-6 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl sm:-left-24 sm:top-10 sm:h-72 sm:w-72" />
        <div className="absolute right-0 top-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute -bottom-8 left-1/3 h-44 w-44 rounded-full bg-sky-400/10 blur-3xl sm:bottom-0 sm:h-64 sm:w-64" />
      </div>

      {/* Contenedor Principal Limitado */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col min-h-0 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pt-4 sm:pb-4 lg:px-5 lg:pt-5 lg:pb-5">
        <PortalHeader />

        <main className="mt-3 flex min-h-0 flex-1 flex-col sm:mt-4">
          {paso === 'camara' ? (
            <CamaraStep
              onConsultar={handleConsultar}
              procesando={procesando}
              error={errorMensaje}
              streamActivo={streamActivo}
              cameraError={cameraError}
              videoRef={videoRef}
              onRetryCamera={iniciarCamara}
            />
          ) : empleadoData ? (
            <ResumenStep
              data={empleadoData}
              onCerrar={handleCerrarSesion}
              segundos={segundosRestantes}
            />
          ) : null}
        </main>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

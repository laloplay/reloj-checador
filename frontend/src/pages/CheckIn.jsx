import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Bell,
  Camera as CameraIcon,
  Camera,
  Clock3,
  RefreshCw,
  X,
  AlertCircle,
  User,
  HelpCircle,
  CheckCircle2,
  XCircle,
  LoaderCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useClock } from '../hooks/useClock';
import { useCameraPermission } from '../hooks/useCameraPermission';
import { Logo } from '../components/Logo';

const StatusDisplay = ({ icon, title, message, children }) => (
  <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
    <div className="max-w-sm text-center p-8">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
        {icon}
      </div>
      <h1 className="text-2xl font-semibold text-white">{title}</h1>
      <p className="mt-2 text-slate-400">{message}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  </div>
);

// Nuevo componente para el modal de confirmación de registro facial
const ConfirmacionRegistroFacialModal = ({ isOpen, onClose, empleado, onConfirm, cargandoDetalles }) => {
  if (!isOpen || !empleado) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-[#111217] border border-blue-400/10 rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-5 border-b border-blue-400/10">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-0.5">
              Confirmar registro facial
            </p>
            <h2 className="text-lg font-light text-gray-100 tracking-wide m-0">
              {empleado.nombre_completo}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/10 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-5 flex flex-col gap-4">
          {cargandoDetalles ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <LoaderCircle className="animate-spin" size={32} />
              <p className="text-sm ml-3">Cargando detalles...</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-blue-400/30 bg-blue-500/10 p-4">
              <p className="text-center text-xs text-slate-300">Confirmar datos para registrar rostro:</p>
              <p className="mt-1 text-center text-lg font-semibold text-white">{empleado.nombre_completo}</p>
              <div className="mt-4 space-y-2 border-t border-blue-400/10 pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Puesto:</span>
                  <span className="font-medium text-white">{empleado.puesto_nombre || 'No asignado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Turno:</span>
                  <span className="font-medium text-white">{empleado.turno_nombre || 'No asignado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ingreso:</span>
                  <span className="font-medium text-white">
                    {empleado.fecha_ingreso
                      ? new Date(empleado.fecha_ingreso).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
                      : 'No asignada'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 pb-6 pt-4 border-t border-blue-400/10 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-transparent border border-white/10 rounded-lg text-gray-400 text-sm hover:bg-white/5 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={cargandoDetalles}
            className="flex-2 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Aceptar y Abrir Cámara
          </button>
        </div>
      </div>
    </div>
  );
};

const AppHeader = ({ onOpenPendientes, pendientesCount }) => (
  <header className="flex shrink-0 items-center justify-between gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 px-3 py-2.5 shadow-lg shadow-black/20 backdrop-blur-2xl sm:rounded-[1.75rem] sm:px-5 sm:py-3">
    <Logo size="header" />
    <button
      type="button"
      onClick={onOpenPendientes}
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-slate-200 transition hover:bg-white/20 hover:text-white active:scale-95 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:h-12 sm:w-12"
      aria-label="Abrir pendientes faciales"
    >
      <Bell size={18} />
      {pendientesCount > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-slate-950">
          {pendientesCount > 9 ? '9+' : pendientesCount}
        </span>
      )}
    </button>
  </header>
);

const ResultadoOverlay = ({ resultado }) => {
  if (!resultado) return null;
  const { exito, mensaje, tieneBono, esRetardo, minutosDiferencia, tipo } = resultado;
  const esSalida = tipo === 'salida';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`absolute inset-0 flex items-center justify-center px-5 ${exito ? 'bg-emerald-950/90' : 'bg-rose-950/90'}`}
    >
      <div className="max-w-sm text-center text-white">
        <div
          className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full sm:h-20 sm:w-20 ${
            exito ? 'bg-emerald-500/20' : 'bg-rose-500/20'
          }`}
        >
          {exito ? (
            <CheckCircle2 className="text-emerald-400" size={36} />
          ) : (
            <XCircle className="text-rose-400" size={36} />
          )}
        </div>
        <p className="mb-1 text-lg font-semibold sm:text-xl">{mensaje || (exito ? 'Operación completada' : 'Ocurrió un error')}</p>
        {exito && esSalida ? (
          <p className="text-sm text-emerald-200">¡Nos vemos mañana!</p>
        ) : exito && tieneBono ? (
          <p className="text-sm text-emerald-200">¡Felicidades, registro puntual!</p>
        ) : exito && esRetardo ? (
          <p className="text-sm text-amber-300">
            Registrado con {typeof minutosDiferencia === 'number' ? `${minutosDiferencia} min ` : ''}de retardo
          </p>
        ) : null}
      </div>
    </div>
  );
};

const CameraView = ({ videoRef, procesando, resultado, streamActivo, cameraError, onRetryCamera }) => (
  <div className="relative flex-1 min-h-0 px-4 pb-4 sm:px-5 sm:pb-5 lg:px-6 lg:pb-6">
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
              <p className="text-sm tracking-wide text-white sm:text-base">Verificando...</p>
            </div>
          </div>
        )}

        <ResultadoOverlay resultado={resultado} />
      </div>
    </div>
  </div>
);

const PendientesSidePanel = ({ isOpen, onClose, pendientes, onSelect, isLoading }) => (
  <div className={`fixed inset-0 z-40 flex ${isOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isOpen}>
    <button
      type="button"
      onClick={onClose}
      tabIndex={isOpen ? 0 : -1}
      className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
      aria-label="Cerrar panel"
    />
    <div
      className={`relative ml-auto flex h-full w-full max-w-md flex-col border-l border-white/10 bg-slate-950/95 shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-200/70">Alertas</p>
          <h2 className="truncate text-xl font-semibold text-white">Registro facial pendiente</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          tabIndex={isOpen ? 0 : -1}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/20 hover:text-white active:scale-95 touch-manipulation"
          aria-label="Cerrar panel de pendientes"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-100">
          Selecciona un empleado de la lista para iniciar el proceso de registro facial desde la pantalla principal.
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-400">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-400" />
            <p className="text-sm">Cargando pendientes...</p>
          </div>
        ) : pendientes.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center text-sm text-slate-400">
            No hay empleados con registro pendiente.
          </div>
        ) : (
          pendientes.map((empleado) => (
            <button
              key={empleado.id}
              type="button"
              onClick={() => onSelect(empleado)}
              tabIndex={isOpen ? 0 : -1}
              className="w-full touch-manipulation rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-white/20 hover:bg-white/10 active:scale-[0.98]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{empleado.nombre_completo}</p>
                  <p className="mt-1 truncate text-sm text-slate-400">{empleado.sucursal_nombre || 'Sin sucursal'}</p>
                  <p className="mt-2 text-xs text-yellow-400">Expira en: {empleado.tiempo_restante_texto || 'N/A'}</p>
                </div>
                <span className="shrink-0 rounded-full bg-rose-500/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-200">
                  Pendiente
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  </div>
);

export function CheckIn() {
  const { permission, requestPermission } = useCameraPermission();

  const { hora, fecha } = useClock();

  const [procesando, setProcesando] = useState(false);
  const [processingType, setProcessingType] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [streamActivo, setStreamActivo] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [pendientesFacial, setPendientesFacial] = useState([]);
  const [panelPendientesAbierto, setPanelPendientesAbierto] = useState(false);
  const [pendienteSeleccionado, setPendienteSeleccionado] = useState(null);
  const [solicitudEnviando, setSolicitudEnviando] = useState(false);
  const [cargandoPendientes, setCargandoPendientes] = useState(false);
  const [empleadoParaConfirmar, setEmpleadoParaConfirmar] = useState(null); // Empleado para mostrar en el modal
  const [confirmacionModalAbierto, setConfirmacionModalAbierto] = useState(false); // Estado del modal de confirmación
  const [cargandoDetalles, setCargandoDetalles] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const iniciarCamara = useCallback(async () => {
    if (cameraError) setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: {width:{ ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActivo(true);
      }
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      setStreamActivo(false);
      setCameraError(true);
    }
  }, [cameraError]);

  useEffect(() => {
    const cargarPendientes = async () => {
      try {
        setCargandoPendientes(true);
        const { data } = await api.get('/empleados/pendientes-facial');
        setPendientesFacial(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error al cargar pendientes faciales:', error);
      } finally {
        setCargandoPendientes(false);
      }
    };
    cargarPendientes();

    if (permission === 'granted') {
      iniciarCamara();
    }
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [permission, iniciarCamara]);

  const mostrarResultado = (exito, mensaje, extras = {}) => {
    setResultado({ exito, mensaje, ...extras });
    setTimeout(() => setResultado(null), 4000);
  };

  const capturarImagen = () => {
    if (!canvasRef.current || !videoRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg');
  };

  const refrescarPendientes = async () => {
    try {
      const { data } = await api.get('/empleados/pendientes-facial');
      setPendientesFacial(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al refrescar pendientes faciales:', error);
    }
  };

  const capturarYEnviar = async (checkinType) => {
    if (!canvasRef.current || !videoRef.current || procesando || !streamActivo) return;

    try {
      setProcesando(true);
      setProcessingType(checkinType);
      const imagenBase64 = capturarImagen();

      const response = await api.post('/checadas', {
        imagen: imagenBase64,
        tipo: checkinType,
      });

      const data = response.data;
      mostrarResultado(true, checkinType === 'salida' ? 'Salida registrada' : 'Checada registrada', {
        empleadoId: data.empleado_id,
        confianza: data.confianza_facial,
        tieneBono: data.tiene_bono,
        esRetardo: data.es_retardo,
        minutosDiferencia: data.minutos_diferencia,
        tipo: checkinType,
      });
    } catch (error) {
      console.error('Error al capturar y enviar:', error);
      mostrarResultado(false, error.response?.data?.message || 'No se reconoció el rostro');
    } finally {
      setProcesando(false);
      setProcessingType(null);
    }
  };

  const registrarFacialPendiente = async () => {
    if (!pendienteSeleccionado || !streamActivo) return;

    try {
      setProcesando(true);
      const imagenBase64 = capturarImagen();

      await api.post(`/empleados/${pendienteSeleccionado.id}/foto`, {
        imagen: imagenBase64,
      });

      mostrarResultado(true, `Registro facial de ${pendienteSeleccionado.nombre_completo} completado`);
      setPendienteSeleccionado(null);
      setPanelPendientesAbierto(false);
      await refrescarPendientes();
    } catch (error) {
      console.error('Error al registrar facial pendiente:', error);
      mostrarResultado(false, error.response?.data?.message || 'No se pudo registrar el rostro');
    } finally {
      setProcesando(false);
    }
  };

  const enviarSolicitudCorreccion = async () => {
    if (!pendienteSeleccionado) return;

    try {
      setSolicitudEnviando(true);
      await api.post('/solicitudes-correccion', {
        empleado_id: pendienteSeleccionado.id,
        mensaje: `Solicitud de corrección para ${pendienteSeleccionado.nombre_completo}`,
      });

      mostrarResultado(true, 'Solicitud de corrección enviada al administrador');
      setPendienteSeleccionado(null);
      setPanelPendientesAbierto(false);
    } catch (error) {
      console.error('Error al enviar solicitud de corrección:', error);
      mostrarResultado(false, error.response?.data?.message || 'No se pudo enviar la solicitud');
    } finally {
      setSolicitudEnviando(false);
    }
  };

  const confirmarRegistroFacial = () => {
    setPendienteSeleccionado(empleadoParaConfirmar); // Establece el empleado para el registro facial
    setConfirmacionModalAbierto(false); // Cierra el modal
    setEmpleadoParaConfirmar(null); // Limpia el estado del modal
  };

  const cancelarConfirmacionRegistroFacial = () => {
    setConfirmacionModalAbierto(false);
    setEmpleadoParaConfirmar(null);
    setPendienteSeleccionado(null); // Asegura que no haya empleado seleccionado para registro facial
  };

  const handleSelectPendiente = async (empleado) => {
    setPanelPendientesAbierto(false);
    setPendienteSeleccionado(null); // Limpia la selección anterior para evitar conflictos
    setEmpleadoParaConfirmar(null); // Limpia el empleado anterior del modal
    setCargandoDetalles(true);
    try {
      const { data } = await api.get(`/empleados/${empleado.id}`);
      setEmpleadoParaConfirmar(data); // Guarda el empleado para mostrar en el modal
      setConfirmacionModalAbierto(true); // Abre el modal de confirmación
    } catch (error) {
      console.error('Error al cargar detalles del empleado:', error);
      mostrarResultado(false, 'No se pudieron cargar los detalles del empleado.');
    } finally {
      setCargandoDetalles(false);
    }
  };

  if (permission === 'cargando') {
    return <StatusDisplay
      icon={<LoaderCircle className="animate-spin text-cyan-400" size={32} />}
      title="Verificando cámara..."
      message="Un momento, por favor."
    />;
  }

  if (permission === 'denied') {
    return <StatusDisplay
      icon={<AlertTriangle className="text-red-400" size={32} />}
      title="Acceso a la cámara denegado"
      message="Para poder checar, necesitas habilitar el permiso de la cámara en la configuración de tu navegador."
    />;
  }

  if (permission === 'prompt') {
    return <StatusDisplay
      icon={<CameraIcon size={32} className="text-cyan-400" />}
      title="Se necesita la cámara"
      message="Para registrar tu asistencia, necesitamos acceso a la cámara."
    >
      <button
        onClick={requestPermission}
        className="w-full max-w-xs bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition-colors"
      >
        Activar Cámara
      </button>
    </StatusDisplay>;
  }

  // Si llegamos aquí, el permiso está concedido (permission === 'granted')
  return (
    <div
      className="relative flex h-screen w-full select-none flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_25%),linear-gradient(180deg,#020617_0%,#07111f_60%,#020617_100%)] text-white [-webkit-tap-highlight-color:transparent]"
      style={{ height: '100dvh' }}
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-16 top-6 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl sm:-left-24 sm:top-10 sm:h-72 sm:w-72" />
        <div className="absolute right-0 top-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute -bottom-8 left-1/3 h-44 w-44 rounded-full bg-sky-400/10 blur-3xl sm:bottom-0 sm:h-64 sm:w-64" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col min-h-0 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pt-4 sm:pb-4 lg:px-5 lg:pt-5 lg:pb-5">
        <AppHeader onOpenPendientes={() => setPanelPendientesAbierto(true)} pendientesCount={pendientesFacial.length} />

        <main className="mt-3 flex min-h-0 flex-1 flex-col sm:mt-4">
          <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_28px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:rounded-[1.75rem]">
            <div className="shrink-0 border-b border-white/5 p-4 sm:p-5 lg:p-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-cyan-100">
                  <Clock3 size={12} />
                  Registro de hoy
                </div>
                <div className="mt-3 text-4xl font-medium tabular-nums tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {hora}
                </div>
                <div className="mt-2 text-sm text-slate-400 sm:text-base lg:text-lg">{fecha}</div>
              </div>
            </div>

            <CameraView
              videoRef={videoRef}
              procesando={procesando}
              resultado={resultado}
              streamActivo={streamActivo}
              cameraError={cameraError}
              onRetryCamera={iniciarCamara}
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="shrink-0 border-t border-white/5 p-4 sm:p-5 lg:p-6">
              <div className="mx-auto max-w-sm">
                {cargandoDetalles ? (
                  <div className="flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-400">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-400" />
                      <p className="text-sm">Cargando datos...</p>
                    </div>
                  </div>
                ) : pendienteSeleccionado ? (
                  <div className="flex flex-col gap-3">
                    <div className="rounded-2xl border border-blue-400/30 bg-blue-500/10 p-4">
                      <p className="text-center text-xs text-slate-300">Registrando rostro para:</p>
                      <p className="mt-1 text-center text-lg font-semibold text-white">{pendienteSeleccionado.nombre_completo}</p>
                    </div>

                    <button
                      onClick={registrarFacialPendiente}
                      disabled={procesando || !streamActivo}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-300/30 bg-blue-600 px-4 py-3.5 text-sm font-semibold tracking-wide text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                    >
                      <User size={18} />
                      {procesando ? 'Procesando...' : 'Completar registro facial'}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={enviarSolicitudCorreccion}
                        disabled={solicitudEnviando}
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation"
                      >
                        <HelpCircle size={14} />
                        {solicitudEnviando ? 'Enviando...' : 'Pedir ayuda'}
                      </button>
                      <button
                        onClick={() => setPendienteSeleccionado(null)} // Cancela el modo de registro facial
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-700 active:scale-[0.98] touch-manipulation"
                      >
                        <X size={14} />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => capturarYEnviar('entrada')}
                        disabled={procesando || !streamActivo}
                        className="group flex items-center justify-center gap-2 rounded-2xl border border-blue-300/30 bg-blue-600 px-4 py-4 text-sm font-semibold tracking-wide text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                      >
                        <RefreshCw
                          size={16}
                          className={`transition-transform ${
                            procesando && processingType === 'entrada' ? 'animate-spin' : 'group-hover:rotate-45'
                          }`}
                        />
                        Entrada
                      </button>
                      <button
                        onClick={() => capturarYEnviar('salida')}
                        disabled={procesando || !streamActivo}
                        className="group flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-4 text-sm font-medium tracking-wide text-slate-300 transition hover:border-slate-600 hover:bg-slate-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                      >
                        <RefreshCw
                          size={16}
                          className={`transition-transform ${
                            procesando && processingType === 'salida' ? 'animate-spin' : 'group-hover:-rotate-45'
                          }`}
                        />
                        Salida
                      </button>
                    </div>
                    <Link
                      to="/portal"
                      className="w-full text-center rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-700 active:scale-[0.98] sm:hidden"
                    >
                      Consultar mis registros
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>

      <PendientesSidePanel
        isOpen={panelPendientesAbierto}
        onClose={() => setPanelPendientesAbierto(false)}
        pendientes={pendientesFacial}
        onSelect={handleSelectPendiente}
        isLoading={cargandoPendientes}
      />

      {/* Modal de confirmación de registro facial */}
      <ConfirmacionRegistroFacialModal
        isOpen={confirmacionModalAbierto}
        onClose={cancelarConfirmacionRegistroFacial}
        empleado={empleadoParaConfirmar}
        onConfirm={confirmarRegistroFacial}
        cargandoDetalles={cargandoDetalles}
      />
      <Link
        to="/portal"
        className="hidden sm:block fixed bottom-4 right-4 z-20 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition hover:bg-white/20 active:scale-95 sm:bottom-5 sm:right-5 lg:bottom-6 lg:right-6"
      >
        Consultar mis registros
      </Link>
    </div>
  );
}

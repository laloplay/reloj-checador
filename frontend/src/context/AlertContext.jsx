import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const AlertContext = createContext(null);

function inferirTipoAlerta(mensaje = '') {
  const texto = String(mensaje).toLowerCase();
  if (
    texto.includes('correctamente') ||
    texto.includes('éxito') ||
    texto.includes('exito') ||
    texto.includes('guardado') ||
    texto.includes('actualizado') ||
    texto.includes('eliminado')
  ) {
    return 'success';
  }
  if (
    texto.includes('por favor') ||
    texto.includes('completa') ||
    texto.includes('introduce') ||
    texto.includes('selecciona') ||
    texto.includes('no puedes') ||
    texto.includes('obligatorio') ||
    texto.includes('requerido')
  ) {
    return 'warning';
  }
  if (
    texto.includes('error') ||
    texto.includes('no se pudo') ||
    texto.includes('inválid') ||
    texto.includes('falló') ||
    texto.includes('denegado') ||
    texto.includes('permisos')
  ) {
    return 'error';
  }
  return 'info';
}

const VARIANTES_TOAST = {
  success: {
    icon: CheckCircle2,
    border: 'border-emerald-400/25',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    bar: 'bg-emerald-400',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-amber-400/25',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    bar: 'bg-amber-400',
  },
  error: {
    icon: AlertCircle,
    border: 'border-rose-400/25',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
    bar: 'bg-rose-500',
  },
  info: {
    icon: Info,
    border: 'border-cyan-400/25',
    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30',
    bar: 'bg-cyan-400',
  },
};

export function AlertProvider({ children }) {
  const [alertas, setAlertas] = useState([]);
  const [confirmacion, setConfirmacion] = useState(null);
  const confirmResolverRef = useRef(null);

  const cerrarAlerta = useCallback((id) => {
    setAlertas((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const mostrarAlerta = useCallback(
    (opcionesOMensaje, tipoExplicito) => {
      const esObjeto = typeof opcionesOMensaje === 'object' && opcionesOMensaje !== null;
      const mensaje = esObjeto ? opcionesOMensaje.mensaje : String(opcionesOMensaje ?? '');
      if (!mensaje) return;

      const tipo =
        (esObjeto ? opcionesOMensaje.tipo : tipoExplicito) || inferirTipoAlerta(mensaje);
      const duracion = (esObjeto && opcionesOMensaje.duracion) || 4000;

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      setAlertas((prev) => [...prev.slice(-3), { id, mensaje, tipo }]);

      setTimeout(() => {
        cerrarAlerta(id);
      }, duracion);
    },
    [cerrarAlerta]
  );

  const confirmar = useCallback((opcionesOMensaje) => {
    const esObjeto = typeof opcionesOMensaje === 'object' && opcionesOMensaje !== null;
    const mensaje = esObjeto ? opcionesOMensaje.mensaje : String(opcionesOMensaje ?? '');
    const textoLower = mensaje.toLowerCase();

    const esDestructivo =
      (esObjeto && opcionesOMensaje.variante === 'danger') ||
      textoLower.includes('eliminar') ||
      textoLower.includes('desactivar') ||
      textoLower.includes('rechazar');

    const textoConfirmarPorDefecto = textoLower.includes('eliminar')
      ? 'Eliminar'
      : textoLower.includes('desactivar')
        ? 'Desactivar'
        : 'Confirmar';

    const estadoModal = {
      titulo: (esObjeto && opcionesOMensaje.titulo) || 'Confirmar acción',
      mensaje,
      textoConfirmar:
        (esObjeto && opcionesOMensaje.textoConfirmar) || textoConfirmarPorDefecto,
      textoCancelar: (esObjeto && opcionesOMensaje.textoCancelar) || 'Cancelar',
      variante: esDestructivo ? 'danger' : 'primary',
    };

    return new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmacion(estadoModal);
    });
  }, []);

  const resolverConfirmacion = useCallback((resultado) => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(resultado);
      confirmResolverRef.current = null;
    }
    setConfirmacion(null);
  }, []);

  // Cerrar modal de confirmación con tecla Escape
  useEffect(() => {
    if (!confirmacion) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        resolverConfirmacion(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmacion, resolverConfirmacion]);

  // Reemplazo global de window.alert para garantizar que ninguna alerta nativa aparezca
  useEffect(() => {
    const alertNativo = window.alert;
    window.alert = (mensaje) => {
      mostrarAlerta(String(mensaje ?? ''));
    };
    return () => {
      window.alert = alertNativo;
    };
  }, [mostrarAlerta]);

  return (
    <AlertContext.Provider value={{ mostrarAlerta, confirmar }}>
      {children}

      {/* Contenedor flotante de Alertas Liquid Glass */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-3 top-3 z-110 flex w-[calc(100vw-1.5rem)] max-w-sm flex-col gap-2.5 sm:right-6 sm:top-6"
      >
        {alertas.map((item) => {
          const config = VARIANTES_TOAST[item.tipo] || VARIANTES_TOAST.info;
          const IconComponent = config.icon;
          return (
            <div
              key={item.id}
              role="alert"
              className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${config.border} bg-slate-900/85 px-4 py-3.5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-3xl transition-all duration-300`}
            >
              <div className={`absolute inset-y-0 left-0 w-1 ${config.bar}`} />
              <div className="flex items-center gap-3 pl-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${config.badge}`}
                >
                  <IconComponent size={17} />
                </div>
                <p className="min-w-0 flex-1 text-sm leading-snug text-slate-100">
                  {item.mensaje}
                </p>
                <button
                  type="button"
                  onClick={() => cerrarAlerta(item.id)}
                  aria-label="Cerrar alerta"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Confirmación Liquid Glass */}
      {confirmacion && (
        <div
          onClick={() => resolverConfirmacion(false)}
          className="fixed inset-0 z-105 flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-md sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-md flex-col overflow-hidden rounded-[1.75rem] border border-white/12 bg-white/3 shadow-[0_28px_80px_rgba(0,0,0,0.6)] backdrop-blur-3xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                    confirmacion.variante === 'danger'
                      ? 'border-rose-400/25 bg-rose-500/15 text-rose-300'
                      : 'border-cyan-400/25 bg-cyan-500/15 text-cyan-300'
                  }`}
                >
                  <AlertTriangle size={18} />
                </div>
                <h2 className="m-0 text-lg font-light tracking-wide text-gray-100">
                  {confirmacion.titulo}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => resolverConfirmacion(false)}
                aria-label="Cerrar"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-5 sm:px-7 sm:py-6">
              <p className="text-sm leading-relaxed text-slate-300">{confirmacion.mensaje}</p>
            </div>

            <div className="flex gap-3 border-t border-white/10 px-5 pb-5 pt-4 sm:px-7 sm:pb-6">
              <button
                type="button"
                onClick={() => resolverConfirmacion(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                {confirmacion.textoCancelar}
              </button>
              <button
                type="button"
                onClick={() => resolverConfirmacion(true)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium text-white shadow-lg transition active:scale-[0.99] ${
                  confirmacion.variante === 'danger'
                    ? 'bg-rose-600 shadow-rose-950/40 hover:bg-rose-500'
                    : 'bg-cyan-600 shadow-cyan-950/40 hover:bg-cyan-500'
                }`}
              >
                {confirmacion.textoConfirmar}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert debe usarse dentro de un AlertProvider');
  }
  return context;
}


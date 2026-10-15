import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Smartphone, Users } from 'lucide-react';
import api from '../services/api';

const accentStyles = {
  blue: {
    card: 'border-blue-400/15 bg-blue-500/8 shadow-blue-950/30',
    icon: 'text-blue-300 bg-blue-500/10 border-blue-400/20',
    value: 'text-blue-300',
  },
  rose: {
    card: 'border-rose-400/15 bg-rose-500/8 shadow-rose-950/30',
    icon: 'text-rose-300 bg-rose-500/10 border-rose-400/20',
    value: 'text-rose-300',
  },
  cyan: {
    card: 'border-cyan-400/15 bg-cyan-500/8 shadow-cyan-950/30',
    icon: 'text-cyan-300 bg-cyan-500/10 border-cyan-400/20',
    value: 'text-cyan-300',
  },
};

export function SettingsOverlay() {
  const [contadores, setContadores] = useState({
    dispositivos: 0,
    usuarios: 0,
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarContadores = async () => {
      try {
        setCargando(true);
        const [dispositivosRes, usuariosRes] = await Promise.all([
          api.get('/dispositivos?estado=aprobado'),
          api.get('/usuarios'),
        ]);

        setContadores({
          dispositivos: Array.isArray(dispositivosRes.data) ? dispositivosRes.data.length : 0,
          usuarios: Array.isArray(usuariosRes.data) ? usuariosRes.data.length : 0,
        });
      } catch (error) {
        console.error('Error al cargar contadores de ajustes:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarContadores();
  }, []);

  if (cargando) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.9),rgba(2,6,23,1))]" />
        <div className="relative text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-400" />
          <p className="tracking-wide text-slate-300">Cargando ajustes...</p>
        </div>
      </div>
    );
  }

  const sections = [
    {
      to: '/admin/dispositivos',
      label: 'Dispositivos',
      description: 'Aprobar o rechazar equipos',
      icon: Smartphone,
      accent: 'rose',
      count: contadores.dispositivos,
      countLabel: 'activos',
    },
    {
      to: '/admin/usuarios',
      label: 'Usuarios',
      description: 'Gestionar administradores del sistema',
      icon: Users,
      accent: 'blue',
      count: contadores.usuarios,
      countLabel: 'admins',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.96),rgba(2,6,23,1))]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] bg-size-[36px_36px]" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-6 lg:p-8">
          <h1 className="text-3xl font-medium tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ajustes del <span className="text-cyan-300">Sistema</span>
          </h1>
        </section>

        <section className="grid gap-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-medium tracking-tight text-white sm:text-2xl">
                  Ir a una sección
                </h2>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {sections.map((action) => {
                const Icon = action.icon;
                const accent = accentStyles[action.accent] || accentStyles.blue;

                return (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="group rounded-[1.25rem] border border-white/10 bg-slate-950/50 p-4 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/25 hover:bg-slate-950/80"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${accent.icon}`}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-white">{action.label}</h3>
                            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
                              {action.count} {action.countLabel}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-400">{action.description}</p>
                        </div>
                      </div>
                      <ArrowRight
                        size={18}
                        className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-300"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

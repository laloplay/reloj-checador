import { useEffect, useState, useContext } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Building,
  Briefcase,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  ClipboardList,
  Clock,
  DollarSign,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import api from '../services/api';

const navigationGroups = [
    {
        key: 'panel',
        label: 'Panel general',
        items: [
            { path: '/admin/dashboard', label: 'Panel De Control', icon: LayoutDashboard },
            { path: '/admin/reportes', label: 'Reportes', icon: BarChart3 },
        ],
    },
    {
        key: 'gestion-personal',
        label: 'Gestión de personal',
        items: [
            { path: '/admin/empleados', label: 'Empleados', icon: Users },
            { path: '/admin/puestos', label: 'Puestos', icon: Briefcase },
            { path: '/admin/turnos', label: 'Turnos', icon: Clock },
            { path: '/admin/sucursales', label: 'Sucursales', icon: Building },
        ],
    },
    {
        key: 'asistencia',
        label: 'Asistencia y calendario',
        items: [
            { path: '/admin/registros', label: 'Registros', icon: ClipboardList },
            { path: '/admin/ausencias', label: 'Ausencias', icon: CalendarRange },
            { path: '/admin/festivos', label: 'Festivos', icon: CalendarDays },
            { path: '/admin/nomina', label: 'Nómina', icon: DollarSign },
        ],
    },
    {
        key: 'ajustes',
        label: 'Ajustes',
        items: [
            { path: '/admin/dispositivos', label: 'Dispositivos', icon: Settings },
        ],
    },
];

const initialOpenGroups = navigationGroups.reduce((accumulator, group) => {
  accumulator[group.key] = false;
  return accumulator;
}, {});

export function AdminLayout() {
  const auth = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState(initialOpenGroups);
  const [facialesPendientes, setFacialesPendientes] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const cargarFacialesPendientes = async () => {
      try {
        const { data } = await api.get('/empleados/pendientes-facial');
        setFacialesPendientes(data.length || 0);
      } catch (error) {
        console.error('Error al cargar faciales pendientes:', error);
      }
    };

    cargarFacialesPendientes();
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenGroups((current) => {
      const next = { ...current };

      navigationGroups.forEach((group) => {
        const isActiveGroup = group.items.some((item) => location.pathname === item.path);
        if (isActiveGroup) {
          next[group.key] = true;
        }
      });

      return next;
    });
  }, [location.pathname]);

  const toggleGroup = (key) => {
    setOpenGroups((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const handleLogout = () => {
    auth.logout();
    navigate('/admin/login');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-slate-950 text-white">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[86vw] max-w-sm border-r border-white/10 bg-slate-950/95 px-4 py-4 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-transform duration-300 md:sticky md:top-0 md:z-auto md:h-screen md:w-80 md:max-w-none md:translate-x-0 md:border-r md:bg-white/5 md:px-5 md:py-5 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col gap-4 md:gap-3">
          <div className="flex items-center justify-between gap-3 md:block">
            <Logo size="header" />
            <button
              type="button"
              onClick={closeMobileMenu}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white md:hidden"
            >
              <X size={18} />
            </button>
          </div>

          
          <nav className="flex-1 space-y-2 pr-0 md:overflow-hidden">
            {navigationGroups.map((group) => {
              const isOpen = openGroups[group.key] ?? false;
              const groupHasActiveItem = group.items.some((item) => location.pathname === item.path);

              return (
                <div key={group.key} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition ${groupHasActiveItem
                        ? 'border-cyan-400/20 bg-cyan-500/10 text-white'
                        : 'border-white/5 bg-white/0 text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em]">
                      {group.label}
                    </span>
                    <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                  </button>

                  {isOpen && (
                    <div className="space-y-1.5 pl-1">
                      {group.items.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        const showBadge = item.path === '/admin/empleados' && facialesPendientes > 0;

                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={closeMobileMenu}
                            className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 transition ${isActive
                                ? 'border border-cyan-400/20 bg-cyan-500/10 text-white'
                                : 'border border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white'
                              }`}
                          >
                            <Icon size={18} />
                            <span className="flex-1 font-medium">{item.label}</span>
                            {showBadge && (
                              <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-rose-500 px-2 py-1 text-[11px] font-bold text-white">
                                {facialesPendientes}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-300 transition hover:border-rose-400/20 hover:bg-rose-500/10 hover:text-white"
          >
            <LogOut size={18} />
            <span className="font-medium">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur-xl md:hidden">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white"
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0 flex-1 text-center">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Reloj Checador</p>
              <p className="truncate text-sm font-medium text-white">{location.pathname.replace('/admin/', '') || 'dashboard'}</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white"
              aria-label="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full px-0 pb-0 md:px-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

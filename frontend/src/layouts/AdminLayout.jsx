import { useEffect, useState, useContext } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3,Users, Building,Clock,Briefcase,DollarSign,Settings,LogOut,LayoutDashboard,ClipboardList,CalendarDays,CalendarRange,ChevronDown } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import api from '../services/api';

const navigationGroups = [
    {
        key: 'panel',
        label: 'Panel general',
        items: [
            { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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

  return (
    <div className="flex h-screen bg-neutral-950">
      {/* Sidebar */}
      <div className="w-64 bg-neutral-900 border-r border-blue-900/30 flex flex-col p-6">
        {/* Logo */}
        <div className="mb-8">
          <Logo size="md" />
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-4 overflow-y-auto pr-1">
          {navigationGroups.map((group) => {
            const isOpen = openGroups[group.key] ?? false;
            const groupHasActiveItem = group.items.some((item) => location.pathname === item.path);

            return (
              <div key={group.key} className="space-y-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition ${groupHasActiveItem
                      ? 'border-blue-500/30 bg-blue-950/30 text-white'
                      : 'border-transparent text-gray-300 hover:text-white hover:bg-blue-900/10'
                    }`}
                >
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold">
                    {group.label}
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                </button>

                {isOpen && (
                  <div className="space-y-2 pl-2">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.path;
                      const Icon = item.icon;
                      const showBadge = item.path === '/admin/empleados' && facialesPendientes > 0;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-400 hover:text-white hover:bg-blue-900/20'
                            }`}
                        >
                          <Icon size={18} />
                          <span className="flex-1 font-medium">{item.label}</span>
                          {showBadge && (
                            <span className="ml-auto inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-rose-500 text-white text-[11px] font-bold">
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

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition w-full"
        >
          <LogOut size={20} />
          <span className="font-medium">Cerrar sesión</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

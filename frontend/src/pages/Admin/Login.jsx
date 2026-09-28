import { useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LockKeyhole, LogIn, UserRound } from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { Logo } from '../../components/Logo';

export function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      setCargando(true);
      const response = await api.post('/auth/login', { username, password });
      const { token } = response.data;

      login(token);
      const destino = location.state?.from?.pathname || '/admin/dashboard';
      navigate(destino, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || 'Error al iniciar sesión. Intenta de nuevo.'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_25%),linear-gradient(180deg,#020617_0%,#07111f_60%,#020617_100%)] p-3 text-white [-webkit-tap-highlight-color:transparent] sm:p-4"
      style={{ minHeight: '100dvh' }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 top-6 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl sm:-left-24 sm:top-10 sm:h-72 sm:w-72" />
        <div className="absolute right-0 top-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute -bottom-8 left-1/3 h-44 w-44 rounded-full bg-sky-400/10 blur-3xl sm:bottom-0 sm:h-64 sm:w-64" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <header className="mb-4 flex items-center justify-center rounded-[1.25rem] border border-white/10 bg-white/5 px-5 py-3 shadow-lg shadow-black/20 backdrop-blur-2xl sm:mb-5 sm:rounded-[1.75rem]">
          <Logo size="header" />
        </header>

        <main className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_28px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:rounded-[1.75rem]">
          <div className="border-b border-white/5 p-5 sm:p-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-cyan-100">
              <LockKeyhole size={12} />
              Acceso seguro
            </div>
            <h1 className="mt-4 text-3xl font-medium tracking-tight text-white sm:text-4xl">Panel Admin</h1>
            <p className="mt-2 text-sm text-slate-400 sm:text-base">Ingresa tus credenciales para continuar.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
            <div>
              <label className="mb-2 block text-sm font-medium tracking-wide text-slate-200">Usuario</label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-3 pl-11 pr-4 text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50 focus:bg-slate-950/70 focus:ring-2 focus:ring-cyan-400/15"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium tracking-wide text-slate-200">Contraseña</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-3 pl-11 pr-4 text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50 focus:bg-slate-950/70 focus:ring-2 focus:ring-cyan-400/15"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3">
                <p className="text-sm text-rose-200">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 font-medium tracking-wide text-white shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cargando ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-b-white" />
                  Ingresando...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Ingresar
                </>
              )}
            </button>
          </form>
        </main>

        <p className="mt-5 text-center text-xs tracking-wide text-slate-500">Reloj Checador © 2026 UNIFAM</p>
      </div>
    </div>
  );
}

import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { Logo } from '../../components/Logo';

export function AdminLogin() {
  const navigate = useNavigate();
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
      navigate('/admin/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Error al iniciar sesión. Intenta de nuevo.'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <Logo size="lg" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-white tracking-wide">Panel Admin</h1>
          <p className="text-gray-400 mt-2 text-sm">Ingresa tus credenciales</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2 tracking-wide">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full px-4 py-3 bg-neutral-800 border border-blue-900/40 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2 tracking-wide">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-neutral-800 border border-blue-900/40 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg tracking-wide hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {cargando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

        <p className="text-gray-500 text-xs text-center mt-8 tracking-wide">
          Reloj Checador © 2026 UNIFAM
        </p>
      </div>
    </div>
  );
}

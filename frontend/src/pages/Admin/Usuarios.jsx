import { useContext, useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Users } from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

export function AdminUsuarios() {
  const { admin } = useContext(AuthContext);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    username: '',
    password: '',
    confirmarPassword: '',
    activo: true,
  });
  const [errorFormulario, setErrorFormulario] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const res = await api.get('/usuarios');
      setUsuarios(res.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setCargando(false);
    }
  };

  const abrirModalCrear = () => {
    setUsuarioEditando(null);
    setErrorFormulario('');
    setFormData({
      nombre_completo: '',
      username: '',
      password: '',
      confirmarPassword: '',
      activo: true,
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (usuario) => {
    setUsuarioEditando(usuario);
    setErrorFormulario('');
    setFormData({
      nombre_completo: usuario.nombre_completo || '',
      username: usuario.username || '',
      password: '',
      confirmarPassword: '',
      activo: usuario.activo ?? true,
    });
    setModalAbierto(true);
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();
    setErrorFormulario('');

    const cleanUsername = formData.username.trim();
    if (!cleanUsername) {
      setErrorFormulario('El nombre de usuario es obligatorio.');
      return;
    }

    if (/\s/.test(cleanUsername)) {
      setErrorFormulario('El nombre de usuario no puede contener espacios.');
      return;
    }

    if (!usuarioEditando && !formData.password) {
      setErrorFormulario('La contraseña es obligatoria para crear un usuario.');
      return;
    }

    if (formData.password || formData.confirmarPassword) {
      if (formData.password !== formData.confirmarPassword) {
        setErrorFormulario('Las contraseñas no coinciden.');
        return;
      }
    }

    try {
      setGuardando(true);

      if (usuarioEditando) {
        const payload = {
          nombre_completo: formData.nombre_completo.trim(),
          username: cleanUsername,
          activo: formData.activo,
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        await api.put(`/usuarios/${usuarioEditando.id}`, payload);
      } else {
        await api.post('/usuarios', {
          nombre_completo: formData.nombre_completo.trim(),
          username: cleanUsername,
          password: formData.password,
        });
      }

      await cargarUsuarios();
      setModalAbierto(false);
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      const mensaje = error.response?.data?.message || 'Error al guardar el usuario';
      setErrorFormulario(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarUsuario = async (usuario) => {
    if (String(usuario.id) === String(admin?.id)) {
      alert('No puedes eliminar tu propio usuario.');
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar al usuario "${usuario.username}"?`)) {
      return;
    }

    try {
      await api.delete(`/usuarios/${usuario.id}`);
      await cargarUsuarios();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert(error.response?.data?.message || 'Error al eliminar el usuario');
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin registro';
    try {
      return new Date(fecha).toLocaleString('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return 'Sin registro';
    }
  };

  if (cargando) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.96),rgba(2,6,23,1))]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] bg-size-[36px_36px]" />
        <div className="relative text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-500"></div>
          <p className="tracking-wide text-slate-400">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  const esPropioUsuarioEditando =
    usuarioEditando && String(usuarioEditando.id) === String(admin?.id);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.96),rgba(2,6,23,1))]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] bg-size-[36px_36px]" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-cyan-100">
              <Users size={12} />
              Administración del sistema
            </div>
            <h1 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">
              Usuarios
            </h1>
          </div>

          <button
            onClick={abrirModalCrear}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-500 active:scale-[0.99] sm:w-auto"
          >
            <Plus size={18} />
            Nuevo usuario
          </button>
        </div>

        {usuarios.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/3 px-6 py-16 text-center">
            <Users className="mx-auto mb-4 text-slate-600" size={34} />
            <p className="font-medium text-slate-300">No hay usuarios registrados</p>
            <p className="mt-1 text-sm text-slate-500">
              Agrega el primer administrador para comenzar.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-225 border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/2">
                    <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Nombre completo
                    </th>
                    <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Usuario
                    </th>
                    <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Estado
                    </th>
                    <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Último acceso
                    </th>
                    <th className="px-5 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => {
                    const esPropio = String(usuario.id) === String(admin?.id);
                    return (
                      <tr
                        key={usuario.id}
                        className="border-b border-white/10 transition-colors hover:bg-cyan-500/5"
                      >
                        <td className="px-5 py-4 font-medium text-white">
                          <div className="flex items-center gap-2">
                            <span>{usuario.nombre_completo || 'Sin nombre'}</span>
                            {esPropio && (
                              <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                                Tú
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-sm text-slate-300">
                          {usuario.username}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-block rounded-full border px-3 py-1 text-sm font-medium ${
                              usuario.activo
                                ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
                                : 'border-rose-400/20 bg-rose-500/10 text-rose-300'
                            }`}
                          >
                            {usuario.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-400">
                          {formatearFecha(usuario.ultimo_acceso)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => abrirModalEditar(usuario)}
                              title="Editar usuario"
                              className="inline-flex items-center gap-1 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 transition hover:bg-cyan-500/20"
                            >
                              <Edit size={16} />
                            </button>
                            {!esPropio && (
                              <button
                                type="button"
                                onClick={() => eliminarUsuario(usuario)}
                                title="Eliminar usuario"
                                className="inline-flex items-center gap-1 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300 transition hover:bg-rose-500/20"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {modalAbierto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-md sm:p-4">
            <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/2 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
                <div>
                  <p className="mb-0.5 text-[11px] font-medium uppercase tracking-widest text-gray-500">
                    Administración del sistema
                  </p>
                  <h2 className="m-0 text-lg font-light tracking-wide text-gray-100">
                    {usuarioEditando ? 'Editar usuario' : 'Nuevo usuario'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-gray-200"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={guardarUsuario} className="flex max-h-[calc(100dvh-10rem)] flex-col">
                <div className="flex flex-col gap-4 overflow-y-auto px-5 py-5 sm:px-7">
                  {errorFormulario && (
                    <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300">
                      {errorFormulario}
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-gray-500">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={formData.nombre_completo}
                      onChange={(e) =>
                        setFormData({ ...formData, nombre_completo: e.target.value })
                      }
                      placeholder="Ej. Juan Pérez"
                      className="w-full rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-sm text-white shadow-inner transition focus:border-cyan-400 focus:bg-white/10 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-gray-500">
                      Usuario
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value.replace(/\s/g, '') })
                      }
                      placeholder="Ej. jperez"
                      required
                      className="w-full rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-sm text-white shadow-inner transition focus:border-cyan-400 focus:bg-white/10 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-gray-500">
                      {usuarioEditando ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required={!usuarioEditando}
                      placeholder={usuarioEditando ? 'Dejar en blanco para no cambiar' : '••••••••'}
                      className="w-full rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-sm text-white shadow-inner transition focus:border-cyan-400 focus:bg-white/10 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-gray-500">
                      Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      value={formData.confirmarPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmarPassword: e.target.value })
                      }
                      required={!usuarioEditando || Boolean(formData.password)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-sm text-white shadow-inner transition focus:border-cyan-400 focus:bg-white/10 focus:outline-none"
                    />
                  </div>

                  {usuarioEditando && (
                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-gray-500">
                        Estado
                      </label>
                      <select
                        value={String(formData.activo)}
                        disabled={esPropioUsuarioEditando}
                        onChange={(e) =>
                          setFormData({ ...formData, activo: e.target.value === 'true' })
                        }
                        className="w-full rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-sm text-white shadow-inner transition focus:border-cyan-400 focus:bg-white/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                      </select>
                      {esPropioUsuarioEditando && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          No puedes desactivar tu propio usuario.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 border-t border-white/10 px-5 pb-5 pt-4 sm:px-7 sm:pb-6">
                  <button
                    type="button"
                    onClick={() => setModalAbierto(false)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="flex-1 rounded-xl bg-cyan-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-900/20 transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


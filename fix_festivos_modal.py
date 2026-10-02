import re

with open('frontend/src/pages/Admin/Festivos.jsx', 'r') as f:
    content = f.read()

# Replace the modal block from line 226 to line 303
old_block = """            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light text-white tracking-wide">
                {festivoEditando ? 'Editar día festivo' : 'Nuevo día festivo'}
              </h2>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={guardarFestivo} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Fecha</label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="aplica_todos_los_años"
                  type="checkbox"
                  checked={formData.aplica_todos_los_años}
                  onChange={(e) => setFormData({ ...formData, aplica_todos_los_años: e.target.checked })}
                  className="h-4 w-4 rounded accent-cyan-500"
                />
                <label htmlFor="aplica_todos_los_años" className="text-gray-300 text-sm font-medium">
                  Aplica todos los años
                </label>
              </div>

              {festivoEditando && (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Estado</label>
                  <select
                    value={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.value === 'true' })}
                    className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              )}

                        </div>
          <div className="flex gap-3 border-t border-white/10 px-5 pb-5 pt-4 sm:px-7 sm:pb-6">
            <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 text-sm font-medium hover:bg-white/10 transition"
            >
                Cancelar
            </button>
            <button
                type="submit"
                disabled={guardando}
                className="flex-1 py-2.5 bg-cyan-600 text-white text-sm font-medium rounded-xl hover:bg-cyan-500 shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
                {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>"""

new_block = """            <div className="flex items-center justify-between border-b border-white/10 px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
              <div>
                  <p className="text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-0.5">Gestión de personal</p>
                  <h2 className="text-lg font-light text-gray-100 tracking-wide m-0">
                      {festivoEditando ? 'Editar día festivo' : 'Nuevo día festivo'}
                  </h2>
              </div>
              <button
                  onClick={() => setModalAbierto(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/10 transition"
              >
                  <X size={16} />
              </button>
            </div>

            <form onSubmit={guardarFestivo} className="flex flex-col max-h-[calc(100dvh-10rem)]">
              <div className="flex flex-col gap-4 px-5 py-5 sm:px-7 overflow-y-auto">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Nombre</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Fecha</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="aplica_todos_los_años"
                    type="checkbox"
                    checked={formData.aplica_todos_los_años}
                    onChange={(e) => setFormData({ ...formData, aplica_todos_los_años: e.target.checked })}
                    className="h-4 w-4 rounded accent-cyan-500"
                  />
                  <label htmlFor="aplica_todos_los_años" className="text-gray-300 text-sm font-medium">
                    Aplica todos los años
                  </label>
                </div>

                {festivoEditando && (
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">Estado</label>
                    <select
                      value={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.value === 'true' })}
                      className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 border-t border-white/10 px-5 pb-5 pt-4 sm:px-7 sm:pb-6">
                <button
                    type="button"
                    onClick={() => setModalAbierto(false)}
                    className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 text-sm font-medium hover:bg-white/10 transition"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={guardando}
                    className="flex-1 py-2.5 bg-cyan-600 text-white text-sm font-medium rounded-xl hover:bg-cyan-500 shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>"""

content = content.replace(old_block, new_block)

with open('frontend/src/pages/Admin/Festivos.jsx', 'w') as f:
    f.write(content)


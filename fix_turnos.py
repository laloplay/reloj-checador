with open('frontend/src/pages/Admin/Turnos.jsx', 'r') as f:
    content = f.read()

old_header = """        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-light text-white tracking-wide">Turnos</h1>
            <p className="text-gray-400 text-sm mt-2">Gestiona los turnos de trabajo</p>
          </div>
          <button
            onClick={abrirModalCrear}
            className="inline-flex items-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition"
          >
            <Plus size={20} />
            Nuevo turno
          </button>
        </div>"""

new_header = """        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-cyan-100">
                <Clock size={12} />
                Gestión de personal
            </div>
            <h1 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">Turnos</h1>
          </div>
          <button
            onClick={abrirModalCrear}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-500 active:scale-[0.99] sm:w-auto"
          >
            <Plus size={18} />
            Nuevo turno
          </button>
        </div>"""

content = content.replace(old_header, new_header)

with open('frontend/src/pages/Admin/Turnos.jsx', 'w') as f:
    f.write(content)

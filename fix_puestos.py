with open('frontend/src/pages/Admin/Puestos.jsx', 'r') as f:
    content = f.read()

old_header = """                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-light text-white tracking-wide">Puestos</h1>
                        <p className="text-gray-400 text-sm mt-2">Gestiona los puestos de la empresa</p>
                    </div>
                    <button
                        onClick={abrirModalCrear}
                        className="inline-flex items-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition"
                    >
                        <Plus size={20} />
                        Nuevo puesto
                    </button>
                </div>"""

new_header = """                <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-cyan-100">
                            <Briefcase size={12} />
                            Gestión de personal
                        </div>
                        <h1 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">Puestos</h1>
                    </div>
                    <button
                        onClick={abrirModalCrear}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-500 active:scale-[0.99] sm:w-auto"
                    >
                        <Plus size={18} />
                        Nuevo puesto
                    </button>
                </div>"""

old_empty = """                {puestosFiltrados.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400 tracking-wide">No hay puestos registrados</p>
                    </div>
                ) : ("""

new_empty = """                {puestosFiltrados.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-white/3 px-6 py-16 text-center">
                        <Briefcase className="mx-auto mb-4 text-slate-600" size={34} />
                        <p className="font-medium text-slate-300">No hay puestos registrados</p>
                        <p className="mt-1 text-sm text-slate-500">Agrega el primero para comenzar a estructurar tu equipo.</p>
                    </div>
                ) : ("""

content = content.replace(old_header, new_header)
content = content.replace(old_empty, new_empty)

# Also remove hidden and md:block from table container
content = content.replace('hidden overflow-hidden rounded-3xl', 'overflow-hidden rounded-3xl')
content = content.replace('backdrop-blur-xl md:block', 'backdrop-blur-xl')


with open('frontend/src/pages/Admin/Puestos.jsx', 'w') as f:
    f.write(content)

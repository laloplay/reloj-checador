import re

with open('frontend/src/pages/Admin/Sucursales.jsx', 'r') as f:
    content = f.read()

old_container_start = """    return (
        <div className="min-h-screen bg-neutral-950 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-light text-white tracking-wide">Sucursales</h1>
                        <p className="text-gray-400 text-sm mt-2">Gestiona las sucursales de la empresa</p>
                    </div>
                    <button
                        onClick={abrirModalCrear}
                        className="inline-flex items-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition"
                    >
                        <Plus size={20} />
                        Nueva sucursal
                    </button>
                </div>"""

new_container_start = """    return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.96),rgba(2,6,23,1))]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] bg-size-[36px_36px]" />
      
      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-cyan-100">
                    <Building size={12} />
                    Gestión de personal
                </div>
                <h1 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">Sucursales</h1>
            </div>
            <button
                onClick={abrirModalCrear}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-500 active:scale-[0.99] sm:w-auto"
            >
                <Plus size={18} />
                Nueva sucursal
            </button>
        </div>"""

old_empty = """                {sucursales.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400 tracking-wide">No hay sucursales registradas</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">"""

new_empty = """                {sucursales.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-white/3 px-6 py-16 text-center">
                        <Building className="mx-auto mb-4 text-slate-600" size={34} />
                        <p className="font-medium text-slate-300">No hay sucursales registradas</p>
                        <p className="mt-1 text-sm text-slate-500">Agrega la primera sucursal para comenzar.</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-225 border-collapse">"""

content = content.replace(old_container_start, new_container_start)
content = content.replace(old_empty, new_empty)

# Also fix the end of the return statement since we changed how many divs are open
old_end = """                        </table>
                    </div>
                )}
            </div>

            {modalAbierto && ("""

new_end = """                        </table>
                      </div>
                    </div>
                )}

            {modalAbierto && ("""

old_final = """            )}
        </div>
    );"""

new_final = """            )}
      </div>
    </div>
    );"""

content = content.replace(old_end, new_end)
content = content.replace(old_final, new_final)

with open('frontend/src/pages/Admin/Sucursales.jsx', 'w') as f:
    f.write(content)

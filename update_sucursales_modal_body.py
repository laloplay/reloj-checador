import re

with open('frontend/src/pages/Admin/Sucursales.jsx', 'r') as f:
    content = f.read()

# Form Body
content = content.replace('<form onSubmit={guardarSucursal} className="space-y-4">', '<form onSubmit={guardarSucursal} className="flex flex-col max-h-[calc(100dvh-10rem)]">\n                            <div className="flex flex-col gap-4 px-5 py-5 sm:px-7 overflow-y-auto">')

# Labels and Inputs
content = content.replace('<label className="block text-gray-300 text-sm font-medium mb-2">', '<label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">')

content = content.replace(
    'className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"',
    'className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"'
)

# Textarea
content = content.replace(
    'className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition min-h-[100px]"',
    'className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition min-h-[100px]"'
)

# Select
content = content.replace(
    'className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 transition"',
    'className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"'
)

# Fix missing closing div for the new form inner wrapper
old_footer = """                            <div className="flex gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setModalAbierto(false)}
                                    className="flex-1 py-2 bg-neutral-800 text-gray-300 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardando}
                                    className="flex-1 py-2 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    {guardando ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>"""
new_footer = """                            </div>
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

content = content.replace(old_footer, new_footer)

with open('frontend/src/pages/Admin/Sucursales.jsx', 'w') as f:
    f.write(content)

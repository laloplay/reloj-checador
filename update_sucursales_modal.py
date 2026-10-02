import re

with open('frontend/src/pages/Admin/Sucursales.jsx', 'r') as f:
    content = f.read()

# Replace Modal Wrapper
content = content.replace(
    '<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">',
    '<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-md sm:p-4">'
)
content = content.replace(
    '<div className="bg-neutral-900 border border-blue-900/30 rounded-lg p-8 max-w-md w-full">',
    '<div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.02] bg-gradient-to-br from-white/5 to-transparent shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-3xl flex flex-col">'
)

# Header
old_header = """                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-light text-white tracking-wide">
                                {sucursalEditando ? 'Editar sucursal' : 'Nueva sucursal'}
                            </h2>
                            <button
                                onClick={() => setModalAbierto(false)}
                                className="text-gray-400 hover:text-gray-300"
                            >
                                <X size={24} />
                            </button>
                        </div>"""
new_header = """                        <div className="flex items-center justify-between border-b border-white/10 px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
                            <div>
                                <p className="text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-0.5">Gestión de personal</p>
                                <h2 className="text-lg font-light text-gray-100 tracking-wide m-0">
                                    {sucursalEditando ? 'Editar sucursal' : 'Nueva sucursal'}
                                </h2>
                            </div>
                            <button
                                onClick={() => setModalAbierto(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/10 transition"
                            >
                                <X size={16} />
                            </button>
                        </div>"""
content = content.replace(old_header, new_header)

# Form Body
content = content.replace('<form onSubmit={guardarSucursal}>', '<form onSubmit={guardarSucursal} className="flex flex-col max-h-[calc(100dvh-10rem)]">\n                            <div className="flex flex-col gap-4 px-5 py-5 sm:px-7 overflow-y-auto">')

# Labels and Inputs
content = content.replace('<div className="mb-4">', '<div>')
content = content.replace('<div className="mb-6">', '<div>')

content = content.replace('<label className="block text-gray-400 text-sm mb-2">', '<label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">')
content = content.replace('className="w-full bg-neutral-800 text-white rounded px-4 py-2 border border-neutral-700 focus:border-blue-500 focus:outline-none"', 'className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"')
content = content.replace('className="w-full bg-neutral-800 text-white rounded px-4 py-2 border border-neutral-700 focus:border-blue-500 focus:outline-none"', 'className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"')

# Footer
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

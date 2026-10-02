import re

with open('frontend/src/pages/Admin/Festivos.jsx', 'r') as f:
    content = f.read()

# Container and Header
content = re.sub(
    r'<div className="min-h-screen bg-neutral-950 p-8">\s*<div className="max-w-6xl mx-auto">\s*<div className="flex items-center justify-between mb-12">\s*<div>\s*<h1 className="text-4xl font-light text-white tracking-wide">Días Festivos</h1>\s*<p className="text-gray-400 text-sm mt-2">Administra los días festivos de México y fechas personalizadas</p>\s*</div>\s*<button[^>]+>\s*<Plus size=\{20\} />\s*Nuevo festivo\s*</button>\s*</div>',
    r'''<div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.96),rgba(2,6,23,1))]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] bg-size-[36px_36px]" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-cyan-100">
                    <Calendar size={12} />
                    Gestión de personal
                </div>
                <h1 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">Días Festivos</h1>
            </div>
            <button
                onClick={abrirModalCrear}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-500 active:scale-[0.99] sm:w-auto"
            >
                <Plus size={18} />
                Nuevo festivo
            </button>
        </div>''',
    content
)

# Empty state
content = re.sub(
    r'\{festivos\.length === 0 \? \(\s*<div className="text-center py-12">\s*<p className="text-gray-400 tracking-wide">No hay días festivos registrados</p>\s*</div>\s*\) : \(\s*<div className="overflow-x-auto">\s*<table className="w-full border-collapse">',
    r'''{festivos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/3 px-6 py-16 text-center">
            <Calendar className="mx-auto mb-4 text-slate-600" size={34} />
            <p className="font-medium text-slate-300">No hay días festivos registrados</p>
            <p className="mt-1 text-sm text-slate-500">Agrega un día festivo para comenzar a gestionarlos.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-225 border-collapse">''',
    content
)

# Close divs
content = re.sub(
    r'</table>\s*</div>\s*\)}',
    r'''</table>
            </div>
          </div>
        )}''',
    content
)

# Fix loading screen
content = re.sub(
    r'<div className="flex items-center justify-center min-h-screen bg-neutral-950">',
    r'<div className="relative min-h-screen overflow-hidden bg-slate-950 text-white flex items-center justify-center">',
    content
)


# Fix the very end to close the relative inner container and the relative outer container
content = re.sub(
    r'        </div>\n    \);\n}',
    r'''        </div>
      </div>
    );
}''',
    content
)


# --- MODAL ---

# Replace Modal Wrapper
content = content.replace(
    '<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">',
    '<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-md sm:p-4">'
)
content = content.replace(
    '<div className="bg-neutral-900 border border-blue-900/30 rounded-lg p-8 max-w-md w-full">',
    '<div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.02] shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-3xl flex flex-col">'
)

content = re.sub(
    r'<div className="flex items-center justify-between mb-6">.*?<h2[^>]*>.*?\{festivoEditando \? \'Editar festivo\' : \'Nuevo festivo\'\}.*?</h2>.*?<button[^>]*onClick=\{([^}]+)\}[^>]*>.*?<X[^>]*>.*?</button>.*?</div>',
    r'''<div className="flex items-center justify-between border-b border-white/10 px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
            <div>
                <p className="text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-0.5">Gestión de personal</p>
                <h2 className="text-lg font-light text-gray-100 tracking-wide m-0">
                    {festivoEditando ? 'Editar festivo' : 'Nuevo festivo'}
                </h2>
            </div>
            <button
                onClick={\1}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/10 transition"
            >
                <X size={16} />
            </button>
        </div>''',
    content,
    flags=re.DOTALL
)

# Form Body
content = re.sub(
    r'<form onSubmit=\{([^}]+)\}>',
    r'<form onSubmit={\1} className="flex flex-col max-h-[calc(100dvh-10rem)]">\n          <div className="flex flex-col gap-4 px-5 py-5 sm:px-7 overflow-y-auto">',
    content
)

content = content.replace('<div className="mb-4">', '<div>')
content = content.replace('<div className="mb-6">', '<div>')
content = content.replace('<label className="block text-gray-400 text-sm mb-2">', '<label className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5">')

content = content.replace(
    'className="w-full bg-neutral-800 text-white rounded px-4 py-2 border border-neutral-700 focus:border-blue-500 focus:outline-none"',
    'className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"'
)

# Modal footer
old_footer = r'<div className="flex gap-3 pt-6">\s*<button\s*type="button"\s*onClick=\{([^}]+)\}\s*className="flex-1 py-2 bg-neutral-800 text-gray-300 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition"\s*>\s*Cancelar\s*</button>\s*<button\s*type="submit"\s*disabled=\{guardando\}\s*className="flex-1 py-2 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition"\s*>\s*\{guardando \? \'Guardando...\' : \'Guardar\'\}\s*</button>\s*</div>\s*</form>'

def footer_replacer(match):
    return f"""          </div>
          <div className="flex gap-3 border-t border-white/10 px-5 pb-5 pt-4 sm:px-7 sm:pb-6">
            <button
                type="button"
                onClick={{{match.group(1)}}}
                className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 text-sm font-medium hover:bg-white/10 transition"
            >
                Cancelar
            </button>
            <button
                type="submit"
                disabled={{guardando}}
                className="flex-1 py-2.5 bg-cyan-600 text-white text-sm font-medium rounded-xl hover:bg-cyan-500 shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
                {{guardando ? 'Guardando...' : 'Guardar'}}
            </button>
          </div>
        </form>"""

content = re.sub(old_footer, footer_replacer, content)

with open('frontend/src/pages/Admin/Festivos.jsx', 'w') as f:
    f.write(content)


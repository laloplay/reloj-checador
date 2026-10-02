import re

with open('frontend/src/pages/Admin/Dispositivos.jsx', 'r') as f:
    content = f.read()

# 1. Update the 'cargando' view
content = re.sub(
    r'<div className="flex items-center justify-center min-h-screen bg-neutral-950">.*?</div>\s*</div>',
    r'''<div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.96),rgba(2,6,23,1))]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] bg-size-[36px_36px]" />
        <div className="relative text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-500"></div>
          <p className="tracking-wide text-slate-400">Cargando dispositivos...</p>
        </div>
      </div>''',
    content,
    flags=re.DOTALL
)

# 2. Main layout replacement
content = re.sub(
    r'<div className="min-h-screen bg-neutral-950 p-8">\s*<div className="max-w-6xl mx-auto">\s*<div className="mb-12">\s*<div className="flex items-center gap-3 mb-2">\s*<Smartphone className="text-blue-400" size=\{28\} />\s*<h1 className="text-4xl font-light text-white tracking-wide">Dispositivos</h1>\s*</div>\s*<p className="text-gray-400 text-sm ml-11">Gestiona los dispositivos registrados</p>\s*</div>',
    r'''<div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.96),rgba(2,6,23,1))]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] bg-size-[36px_36px]" />
      
      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-cyan-100">
                    <Smartphone size={12} />
                    Administración del sistema
                </div>
                <h1 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">Dispositivos</h1>
            </div>
        </div>''',
    content
)

# 3. Empty state replacement
content = re.sub(
    r'<div className="text-center py-12">\s*<AlertCircle className="mx-auto text-gray-500 mb-4" size=\{48\} />\s*<p className="text-gray-400 tracking-wide">No hay dispositivos registrados</p>\s*</div>',
    r'''<div className="rounded-3xl border border-dashed border-white/10 bg-white/3 px-6 py-16 text-center">
            <Smartphone className="mx-auto mb-4 text-slate-600" size={34} />
            <p className="font-medium text-slate-300">No hay dispositivos registrados</p>
            <p className="mt-1 text-sm text-slate-500">Los dispositivos que inicien sesión aparecerán aquí.</p>
          </div>''',
    content
)

# 4. Table container and headers
content = re.sub(
    r'<div className="overflow-x-auto">\s*<table className="w-full border-collapse">\s*<thead>\s*<tr className="border-b border-blue-900/20">',
    r'''<div className="overflow-hidden rounded-3xl border border-white/10 bg-white/4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-225 border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/2">''',
    content
)

content = content.replace(
    'py-4 px-4 text-gray-300 font-medium text-sm uppercase tracking-widest',
    'px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400'
)

# 5. Table rows
content = re.sub(
    r'<tr\s*key=\{dispositivo\.id\}\s*className="border-b border-blue-900/10 hover:bg-blue-900/5 transition"',
    r'<tr key={dispositivo.id} className="border-b border-white/10 hover:bg-cyan-500/5 transition-colors">',
    content
)

# 6. Inputs in edit mode
content = re.sub(
    r'px-2 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white text-sm focus:outline-none focus:border-blue-600',
    r'px-3 py-2 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition',
    content
)

# 7. Edit/Delete/Save Buttons
content = re.sub(
    r'bg-blue-900/30 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-900/50',
    r'bg-cyan-500/10 text-cyan-300 border border-cyan-400/20 rounded-xl hover:bg-cyan-500/20',
    content
)
content = re.sub(
    r'bg-red-900/30 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-900/50',
    r'bg-red-900/30 text-red-400 border border-red-600/30 rounded-xl hover:bg-red-900/50',
    content
)
content = re.sub(
    r'bg-green-900/30 text-green-400 border border-green-600/30 rounded-lg hover:bg-green-900/50',
    r'bg-green-900/30 text-green-400 border border-green-600/30 rounded-xl hover:bg-green-900/50',
    content
)
content = re.sub(
    r'bg-neutral-800 text-gray-300 border border-neutral-600/30 rounded-lg hover:bg-neutral-700',
    r'bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10',
    content
)

# 8. Extra unclosed divs fix at the end (from the original structure)
content = re.sub(
    r'          </div>\s*\)\}\s*</div>\s*</div>\s*\)\;\s*\}',
    r'''            </div>
          </div>
        )}
      </div>
    </div>
  );
}''',
    content
)

with open('frontend/src/pages/Admin/Dispositivos.jsx', 'w') as f:
    f.write(content)

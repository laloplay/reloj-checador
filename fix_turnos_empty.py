with open('frontend/src/pages/Admin/Turnos.jsx', 'r') as f:
    content = f.read()

old_empty = """        {turnosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 tracking-wide">No hay turnos registrados</p>
          </div>
        ) : ("""

new_empty = """        {turnosFiltrados.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/3 px-6 py-16 text-center">
            <Clock className="mx-auto mb-4 text-slate-600" size={34} />
            <p className="font-medium text-slate-300">No hay turnos registrados</p>
            <p className="mt-1 text-sm text-slate-500">Agrega el primero para comenzar a gestionar los horarios.</p>
          </div>
        ) : ("""

content = content.replace(old_empty, new_empty)

with open('frontend/src/pages/Admin/Turnos.jsx', 'w') as f:
    f.write(content)

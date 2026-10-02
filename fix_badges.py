import re

with open('frontend/src/pages/Admin/Dispositivos.jsx', 'r') as f:
    content = f.read()

# Replace getEstadoBadge
content = content.replace(
    "'bg-yellow-900/30 text-yellow-400 border-yellow-600/30'",
    "'bg-amber-500/10 text-amber-300 border-amber-400/20'"
).replace(
    "'bg-green-900/30 text-green-400 border-green-600/30'",
    "'bg-emerald-500/10 text-emerald-300 border-emerald-400/20'"
).replace(
    "'bg-red-900/30 text-red-400 border-red-600/30'",
    "'bg-rose-500/10 text-rose-300 border-rose-400/20'"
).replace(
    "'bg-blue-900/30 text-blue-400 border-blue-600/30'",
    "'bg-cyan-500/10 text-cyan-300 border-cyan-400/20'"
).replace(
    "'bg-neutral-800 text-gray-400 border-neutral-600/30'",
    "'bg-white/5 text-slate-300 border-white/10'"
)

with open('frontend/src/pages/Admin/Dispositivos.jsx', 'w') as f:
    f.write(content)


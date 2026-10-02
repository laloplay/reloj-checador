import re

with open('frontend/src/pages/Admin/Dispositivos.jsx', 'r') as f:
    content = f.read()

content = content.replace(
    "bg-red-900/30 text-red-400 border border-red-600/30 rounded-xl hover:bg-red-900/50",
    "bg-rose-500/10 text-rose-300 border border-rose-400/20 rounded-xl hover:bg-rose-500/20"
)

content = content.replace(
    "bg-green-900/30 text-green-400 border border-green-600/30 rounded-xl hover:bg-green-900/50",
    "bg-emerald-500/10 text-emerald-300 border border-emerald-400/20 rounded-xl hover:bg-emerald-500/20"
)

with open('frontend/src/pages/Admin/Dispositivos.jsx', 'w') as f:
    f.write(content)

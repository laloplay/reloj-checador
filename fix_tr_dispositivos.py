import re

with open('frontend/src/pages/Admin/Dispositivos.jsx', 'r') as f:
    content = f.read()

# Replace the floating >
content = content.replace(
    '<tr key={dispositivo.id} className="border-b border-white/10 hover:bg-cyan-500/5 transition-colors">\n                  >',
    '<tr key={dispositivo.id} className="border-b border-white/10 hover:bg-cyan-500/5 transition-colors">'
)

with open('frontend/src/pages/Admin/Dispositivos.jsx', 'w') as f:
    f.write(content)

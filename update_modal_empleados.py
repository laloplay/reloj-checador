import re

with open('frontend/src/pages/Admin/Empleados.jsx', 'r') as f:
    content = f.read()

# 1. Update Modal Container
content = content.replace(
    'className="max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-hidden rounded-2xl border border-blue-400/10 bg-[#111217] sm:max-h-[calc(100dvh-2rem)]"',
    'className="max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/80 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:max-h-[calc(100dvh-2rem)]"'
)

# 2. General borders and backgrounds
content = content.replace('border-blue-400/10', 'border-white/10')
content = content.replace('border-blue-400/20', 'border-white/10')
content = content.replace('bg-[#1a1d27]', 'bg-white/5')
content = content.replace('bg-[#111217]', 'bg-slate-950/80') # just in case

# 3. Inputs focus and interactions
content = content.replace('focus:border-blue-500', 'focus:border-cyan-400 focus:bg-white/10')
content = content.replace('accent-blue-600', 'accent-cyan-500')

# 4. Buttons (Primary buttons)
content = content.replace('bg-blue-600', 'bg-cyan-600')
content = content.replace('hover:bg-blue-700', 'hover:bg-cyan-500')

# 5. Checkbox wrapper
content = content.replace('hover:border-blue-400/25', 'hover:border-cyan-400/30')

# 6. Camera button
content = content.replace('hover:border-blue-500/50 text-gray-500 hover:text-blue-400', 'hover:border-cyan-400/50 text-slate-500 hover:text-cyan-400')

# 7. Warning/Info boxes
content = content.replace('bg-blue-900/20 border border-blue-500/20 rounded-lg', 'bg-cyan-500/10 border border-cyan-400/20 rounded-xl')
content = content.replace('text-blue-400 text-xs leading-relaxed', 'text-cyan-300 text-xs leading-relaxed')

# 8. Table action button (the edit button in the table list)
content = content.replace('bg-blue-900/30 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-900/50', 'bg-cyan-500/10 text-cyan-300 border border-cyan-400/20 rounded-xl hover:bg-cyan-500/20')

# 9. Table tr hover
content = content.replace('hover:bg-cyan-500/4', 'hover:bg-cyan-500/5') # it was /4, /5 is more standard

with open('frontend/src/pages/Admin/Empleados.jsx', 'w') as f:
    f.write(content)

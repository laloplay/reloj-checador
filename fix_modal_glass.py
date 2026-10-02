import re

with open('frontend/src/pages/Admin/Empleados.jsx', 'r') as f:
    content = f.read()

# 1. Update Modal Container to be true glassmorphism
old_modal_container = 'className="max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/80 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:max-h-[calc(100dvh-2rem)]"'
new_modal_container = 'className="max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:max-h-[calc(100dvh-2rem)] relative"'
content = content.replace(old_modal_container, new_modal_container)

# Add a subtle internal gradient to the modal (optional, but looks good for liquid glass)
# Wait, let's just keep the container classes clean and maybe add a pseudo element or an inner div.
# Instead of an inner div, bg-gradient-to-br from-white/10 to-transparent can give a nice glass shine.
new_modal_container_shine = 'className="max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 bg-gradient-to-br from-white/5 to-transparent shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-3xl sm:max-h-[calc(100dvh-2rem)]"'
content = content.replace(new_modal_container, new_modal_container_shine)
content = content.replace(old_modal_container, new_modal_container_shine)

# 2. Update inputs to use a "recessed" look for contrast inside the glass modal
# Currently inputs are: bg-white/5 border border-white/10
content = content.replace('bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition', 'bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition')
content = content.replace('bg-white/5 border border-white/10 rounded-lg text-gray-400 text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition', 'bg-black/20 border border-white/5 rounded-xl text-gray-300 text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition')
content = content.replace('bg-white/5 border border-white/10 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition', 'bg-black/20 border border-white/5 rounded-xl text-gray-300 text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition')

# 3. Update Checkbox groups and inner containers
content = content.replace('rounded-lg border border-white/10 bg-white/5 p-3', 'rounded-xl border border-white/5 bg-black/20 p-3 shadow-inner')
content = content.replace('bg-neutral-900/60 p-4 backdrop-blur-md', 'bg-black/20 p-4 shadow-inner rounded-xl')
content = content.replace('px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg', 'px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl shadow-inner')

# 4. Buttons
content = content.replace('rounded-lg bg-white/5 border border-white/10', 'rounded-xl bg-white/5 border border-white/10')
content = content.replace('bg-white/5 border border-white/10 rounded-lg hover:bg-white/5 transition text-sm', 'bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-sm font-medium')
content = content.replace('border border-dashed border-white/10 rounded-lg hover:border-cyan-400/50', 'border border-dashed border-white/10 rounded-xl hover:border-cyan-400/50 bg-black/20 shadow-inner')
content = content.replace('bg-transparent border border-white/10 rounded-lg text-gray-400 text-sm hover:bg-white/5 transition', 'bg-white/5 border border-white/10 rounded-xl text-gray-300 text-sm font-medium hover:bg-white/10 transition')
content = content.replace('rounded-lg hover:bg-cyan-500', 'rounded-xl hover:bg-cyan-500 shadow-lg shadow-cyan-900/20')

# 5. Fix camera button aspect ratio box
content = content.replace('bg-white/5', 'bg-black/20') # wait, that would break things I just replaced to bg-white/5. 
# Actually, the camera placeholder is: bg-[#1a1d27] which I changed to bg-white/5.
content = content.replace('gap-3 bg-white/5', 'gap-3 bg-black/20 shadow-inner')

# 6. Modal backdrop: Instead of bg-black/60, let's use a smoother dark blue/slate backdrop
content = content.replace('bg-black/60 p-3 backdrop-blur-sm', 'bg-slate-950/60 p-3 backdrop-blur-md')

with open('frontend/src/pages/Admin/Empleados.jsx', 'w') as f:
    f.write(content)

import re

for filename in ['frontend/src/pages/Admin/Turnos.jsx', 'frontend/src/pages/Admin/Puestos.jsx']:
    with open(filename, 'r') as f:
        content = f.read()

    # Find the block between <div className="flex items-center justify-between mb-6"> and </div> before <form
    content = re.sub(
        r'<div className="flex items-center justify-between mb-6">.*?<h2[^>]*>(.*?)</h2>.*?<button[^>]*onClick=\{([^}]+)\}[^>]*>.*?<X[^>]*>.*?</button>.*?</div>',
        r'''<div className="flex items-center justify-between border-b border-white/10 px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
                            <div>
                                <p className="text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-0.5">Gestión de personal</p>
                                <h2 className="text-lg font-light text-gray-100 tracking-wide m-0">\1</h2>
                            </div>
                            <button
                                onClick={\2}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/10 transition"
                            >
                                <X size={16} />
                            </button>
                        </div>''',
        content,
        flags=re.DOTALL
    )

    with open(filename, 'w') as f:
        f.write(content)


import re

with open('frontend/src/pages/Admin/Nomina.jsx', 'r') as f:
    content = f.read()

# 1. Container and Header
content = re.sub(
    r'<div className="min-h-screen bg-neutral-950 p-8">\s*<style>',
    r'''<div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.96),rgba(2,6,23,1))]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] bg-size-[36px_36px]" />
      <style>''',
    content
)

content = re.sub(
    r'<div className="max-w-7xl mx-auto">\s*<div className="flex items-center justify-between mb-12">\s*<div>\s*<h1 className="text-4xl font-light text-white tracking-wide">Nómina</h1>\s*<p className="text-gray-400 text-sm mt-2">Calcula y exporta la nómina de empleados</p>\s*</div>\s*\{nomina\.length > 0 && \(\s*<button onClick=\{exportarPDF\} disabled=\{generandoPDF\} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">\s*\{generandoPDF \? \'Generando...\' : \'Exportar a PDF\'\}\s*</button>\s*\)\}\s*</div>',
    r'''<div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-cyan-100">
                    <FileText size={12} />
                    Gestión financiera
                </div>
                <h1 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">Nómina</h1>
            </div>
            {nomina.length > 0 && (
                <button
                    onClick={exportarPDF}
                    disabled={generandoPDF}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-green-950/30 transition hover:bg-green-500 active:scale-[0.99] sm:w-auto disabled:opacity-50"
                >
                    {generandoPDF ? 'Generando...' : 'Exportar a PDF'}
                </button>
            )}
        </div>''',
    content
)


# 2. Filters container
content = re.sub(
    r'<div className="bg-neutral-900 border border-blue-900/30 rounded-lg p-8 mb-12">\s*<h2 className="text-2xl font-light text-white tracking-wide mb-6">Parámetros de cálculo</h2>',
    r'''<div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-6 mb-6">
                    <h2 className="text-xl font-medium tracking-tight text-white sm:text-2xl mb-6">Parámetros de cálculo</h2>''',
    content
)

content = content.replace(
    'className="block text-gray-300 text-sm font-medium mb-2"',
    'className="block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1.5"'
)

content = content.replace(
    'className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600"',
    'className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition"'
)
content = content.replace(
    'className="w-full px-4 py-2 bg-neutral-800 border border-blue-900/40 rounded-lg text-white focus:outline-none focus:border-blue-600 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"',
    'className="w-full px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 shadow-inner transition [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"'
)


content = content.replace(
    'className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"',
    'className="w-full py-2.5 bg-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-900/20 hover:bg-cyan-500 disabled:opacity-50 transition text-sm"'
)

# 3. Empty state and Table
content = re.sub(
    r'\{nomina\.length === 0 \? \(\s*<div className="text-center py-12">\s*<p className="text-gray-400 tracking-wide">No hay datos de nómina para los parámetros seleccionados\.</p>\s*</div>\s*\) : \(\s*<div className="overflow-x-auto">\s*<table className="w-full border-collapse">',
    r'''{nomina.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-white/3 px-6 py-16 text-center">
                        <FileText className="mx-auto mb-4 text-slate-600" size={34} />
                        <p className="font-medium text-slate-300">No hay datos de nómina</p>
                        <p className="mt-1 text-sm text-slate-500">Ajusta los parámetros para realizar el cálculo.</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-225 border-collapse">''',
    content
)

# Replace table styles
content = content.replace(
    '<tr className="border-b border-blue-900/20">',
    '<tr className="border-b border-white/10">'
)
content = content.replace(
    'className="border-b border-blue-900/10 hover:bg-blue-900/5 transition"',
    'className="border-b border-white/10 hover:bg-cyan-500/5 transition"'
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

content = re.sub(
    r'        </div>\n    \);\n}',
    r'''        </div>
      </div>
    );
}''',
    content
)


with open('frontend/src/pages/Admin/Nomina.jsx', 'w') as f:
    f.write(content)


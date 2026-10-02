import re

with open('frontend/src/pages/Admin/Empleados.jsx', 'r') as f:
    content = f.read()

old_header = """    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.96),rgba(2,6,23,1))]">
            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] bg-size-[36px_36px]">"""

new_header = """    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.96),rgba(2,6,23,1))]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] bg-size-[36px_36px]" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">"""

content = content.replace(old_header, new_header)

old_footer = """                    </div>
                    </>
                )}
            </div>

            {modalAbierto && ("""

new_footer = """                    </div>
                    </>
                )}
            </div>

            {modalAbierto && ("""

# wait, we just need to replace the two closing divs at the very end.
old_end = """            )}
        </div>
    </div>
    );"""

new_end = """            )}
    </div>
    );"""
content = content.replace(old_end, new_end)

with open('frontend/src/pages/Admin/Empleados.jsx', 'w') as f:
    f.write(content)

with open('frontend/src/pages/Admin/Empleados.jsx', 'r') as f:
    content = f.read()

content = content.replace("            )}\n    </div>\n    );", "            )}\n        </div>\n    </div>\n    );")

with open('frontend/src/pages/Admin/Empleados.jsx', 'w') as f:
    f.write(content)

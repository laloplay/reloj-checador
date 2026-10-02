import re

with open('frontend/src/pages/Admin/Nomina.jsx', 'r') as f:
    content = f.read()

# Replace the block with just ONE </div> (closing the root)
content = content.replace(
    '            </div>\n          </div>\n        </div>\n      </div>\n    );\n}',
    '            </div>\n        </div>\n    );\n}'
)

with open('frontend/src/pages/Admin/Nomina.jsx', 'w') as f:
    f.write(content)

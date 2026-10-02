import re

with open('frontend/src/pages/Admin/Nomina.jsx', 'r') as f:
    content = f.read()

# Add the missing </div> before the final two </div>s
# Current:
#         </div>
#       </div>
#     );
# }
# Target:
#           </div>
#         </div>
#       </div>
#     );
# }

content = content.replace(
    '        </div>\n      </div>\n    );\n}',
    '          </div>\n        </div>\n      </div>\n    );\n}'
)

with open('frontend/src/pages/Admin/Nomina.jsx', 'w') as f:
    f.write(content)

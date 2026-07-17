-- Admin inicial
-- Usuario: admin | Password: 1234
INSERT INTO admins (username, password_hash)
VALUES (
  'admin',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iT9i'
)
ON CONFLICT (username) DO NOTHING;

-- Días festivos de México
INSERT INTO dias_festivos (nombre, fecha, aplica_todos_los_años, activo)
SELECT 'Año Nuevo', '2026-01-01', TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM dias_festivos WHERE nombre = 'Año Nuevo' AND fecha = '2026-01-01');

INSERT INTO dias_festivos (nombre, fecha, aplica_todos_los_años, activo)
SELECT 'Constitución Mexicana', '2026-02-05', TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM dias_festivos WHERE nombre = 'Constitución Mexicana' AND fecha = '2026-02-05');

INSERT INTO dias_festivos (nombre, fecha, aplica_todos_los_años, activo)
SELECT 'Natalicio de Benito Juárez', '2026-03-21', TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM dias_festivos WHERE nombre = 'Natalicio de Benito Juárez' AND fecha = '2026-03-21');

INSERT INTO dias_festivos (nombre, fecha, aplica_todos_los_años, activo)
SELECT 'Día del Trabajo', '2026-05-01', TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM dias_festivos WHERE nombre = 'Día del Trabajo' AND fecha = '2026-05-01');

INSERT INTO dias_festivos (nombre, fecha, aplica_todos_los_años, activo)
SELECT 'Independencia de México', '2026-09-16', TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM dias_festivos WHERE nombre = 'Independencia de México' AND fecha = '2026-09-16');

INSERT INTO dias_festivos (nombre, fecha, aplica_todos_los_años, activo)
SELECT 'Revolución Mexicana', '2026-11-20', TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM dias_festivos WHERE nombre = 'Revolución Mexicana' AND fecha = '2026-11-20');

INSERT INTO dias_festivos (nombre, fecha, aplica_todos_los_años, activo)
SELECT 'Navidad', '2026-12-25', TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM dias_festivos WHERE nombre = 'Navidad' AND fecha = '2026-12-25');


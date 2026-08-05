CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ADMINS
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUCURSALES
CREATE TABLE IF NOT EXISTS sucursales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  direccion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TURNOS
CREATE TABLE IF NOT EXISTS turnos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  duracion_horas NUMERIC(4,2) NOT NULL CHECK (duracion_horas > 0 AND duracion_horas <= 24),
  minutos_bono INTEGER NOT NULL DEFAULT 10 CHECK (minutos_bono >= 0),
  bono_activo BOOLEAN NOT NULL DEFAULT TRUE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL
);

-- PUESTOS
CREATE TABLE IF NOT EXISTS puestos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  salario_base NUMERIC(10, 2) NOT NULL CHECK (salario_base >= 0),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DIAS FESTIVOS
CREATE TABLE IF NOT EXISTS dias_festivos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  fecha DATE NOT NULL,
  aplica_todos_los_años BOOLEAN NOT NULL DEFAULT TRUE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- EMPLEADOS
CREATE TABLE IF NOT EXISTS empleados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_completo VARCHAR(200) NOT NULL,
  fecha_ingreso DATE,
  fecha_nacimiento DATE,
  turno_id UUID REFERENCES turnos(id) ON DELETE SET NULL,
  puesto_id UUID REFERENCES puestos(id) ON DELETE SET NULL,
  dia_descanso INTEGER[] NOT NULL DEFAULT '{}',
  registro_facial_pendiente BOOLEAN NOT NULL DEFAULT FALSE,
  registro_facial_expira TIMESTAMPTZ,
  registro_facial_horas INTEGER NOT NULL DEFAULT 48 CHECK (registro_facial_horas IN (24, 48, 72)),
  aplica_bono BOOLEAN NOT NULL DEFAULT TRUE,
  face_id TEXT,
  foto_url TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
  CONSTRAINT chk_empleados_dia_descanso CHECK (dia_descanso <@ ARRAY[0, 1, 2, 3, 4, 5, 6])
);

-- Compatibilidad para instalaciones creadas con versiones anteriores del esquema.
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS hora_fin TIME;
-- Si la columna 'hora_fin' acaba de ser añadida, poblamos los valores para registros existentes.
DO $$
BEGIN
  UPDATE turnos SET hora_fin = hora_inicio + (duracion_horas * interval '1 hour') WHERE hora_fin IS NULL AND duracion_horas IS NOT NULL;
EXCEPTION WHEN undefined_column THEN
  -- Ignorar si la columna duracion_horas no existe, para compatibilidad con esquemas muy viejos.
END $$;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS dia_descanso INTEGER[] DEFAULT '{}';
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'empleados'
      AND column_name = 'dia_descanso'
      AND data_type <> 'ARRAY'
  ) THEN
    ALTER TABLE empleados
      ALTER COLUMN dia_descanso TYPE INTEGER[]
      USING CASE
        WHEN dia_descanso IS NULL THEN '{}'::INTEGER[]
        ELSE ARRAY[dia_descanso]
      END;
  END IF;
END $$;
ALTER TABLE empleados ALTER COLUMN dia_descanso SET DEFAULT '{}'::INTEGER[];
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS registro_facial_pendiente BOOLEAN DEFAULT FALSE;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS registro_facial_expira TIMESTAMPTZ;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS registro_facial_horas INTEGER DEFAULT 48;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- SOLICITUDES DE CORRECCIÓN
CREATE TABLE IF NOT EXISTS solicitudes_correccion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  mensaje TEXT NOT NULL,
  leida BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AUSENCIAS
CREATE TABLE IF NOT EXISTS ausencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('vacaciones','permiso','descanso')),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  motivo TEXT,
  aprobado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_ausencias_rango CHECK (fecha_fin >= fecha_inicio)
);

-- DISPOSITIVOS
CREATE TABLE IF NOT EXISTS dispositivos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fingerprint TEXT UNIQUE NOT NULL,
  nombre_dispositivo VARCHAR(200),
  ubicacion VARCHAR(200),
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  aprobado_por UUID REFERENCES admins(id) ON DELETE SET NULL,
  aprobado_en TIMESTAMPTZ,
  ultimo_acceso TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
  token TEXT,
  token_expira TIMESTAMPTZ
);

ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS nombre_dispositivo VARCHAR(200);
ALTER TABLE dispositivos ADD COLUMN IF NOT EXISTS ubicacion VARCHAR(200);
-- Renombrar columnas antiguas y asegurar que `token` sea nullable para corregir el error de registro.
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'dispositivos' AND column_name = 'device_jwt') THEN
    ALTER TABLE dispositivos RENAME COLUMN device_jwt TO token;
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'dispositivos' AND column_name = 'device_jwt_expira') THEN
    ALTER TABLE dispositivos RENAME COLUMN device_jwt_expira TO token_expira;
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'dispositivos' AND column_name = 'token') THEN
    ALTER TABLE dispositivos ADD COLUMN token TEXT;
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'dispositivos' AND column_name = 'token_expira') THEN
    ALTER TABLE dispositivos ADD COLUMN token_expira TIMESTAMPTZ;
  END IF;
  ALTER TABLE dispositivos ALTER COLUMN token DROP NOT NULL;
END $$;

-- CHECADAS
CREATE TABLE IF NOT EXISTS checadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  dispositivo_id UUID REFERENCES dispositivos(id) ON DELETE SET NULL,
  sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  turno_id UUID REFERENCES turnos(id) ON DELETE SET NULL,
  tiene_bono BOOLEAN NOT NULL DEFAULT FALSE,
  es_retardo BOOLEAN NOT NULL DEFAULT FALSE,
  minutos_diferencia INTEGER NOT NULL DEFAULT 0,
  confianza_facial NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_checadas_confianza_facial CHECK (confianza_facial IS NULL OR (confianza_facial >= 0 AND confianza_facial <= 100))
);

ALTER TABLE checadas ADD COLUMN IF NOT EXISTS sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL;

-- Índices alineados con filtros, joins y ordenamientos usados por las rutas.
CREATE INDEX IF NOT EXISTS idx_turnos_sucursal ON turnos(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_empleados_sucursal_activo ON empleados(sucursal_id, activo);
CREATE UNIQUE INDEX IF NOT EXISTS idx_empleados_face_id_unico ON empleados(face_id) WHERE face_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ausencias_empleado_fechas ON ausencias(empleado_id, fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_ausencias_aprobadas_fechas ON ausencias(empleado_id, fecha_inicio, fecha_fin) WHERE aprobado = TRUE;
CREATE INDEX IF NOT EXISTS idx_festivos_activos_fecha ON dias_festivos(fecha) WHERE activo = TRUE;
CREATE INDEX IF NOT EXISTS idx_checadas_empleado_timestamp ON checadas(empleado_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_checadas_sucursal_timestamp ON checadas(sucursal_id, timestamp DESC);

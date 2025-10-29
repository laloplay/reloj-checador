const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Empleado = require('./Empleado');
const NominaRun = require('./NominaRun');

const NominaDetalle = sequelize.define('NominaDetalle', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nominaRunId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: NominaRun, key: 'id' }
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Empleado, key: 'id' }
  },
  nombre: { type: DataTypes.STRING },
  puesto: { type: DataTypes.STRING },
  rfc: { type: DataTypes.STRING, defaultValue: 'PECI750723M30' },
  fecha_ingreso: { type: DataTypes.STRING },
  dias_laborados: { type: DataTypes.INTEGER },
  salario_diario: { type: DataTypes.FLOAT },
  sueldo: { type: DataTypes.FLOAT },
  bono_puntualidad: { type: DataTypes.FLOAT, defaultValue: 0 },
  comision: { type: DataTypes.FLOAT, defaultValue: 0 },
  total_percepciones: { type: DataTypes.FLOAT },
  otras_deducciones: { type: DataTypes.FLOAT, defaultValue: 0 },
  neto_a_pagar: { type: DataTypes.FLOAT }
});

module.exports = NominaDetalle;
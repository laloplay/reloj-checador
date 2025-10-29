const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Empleado = require('./Empleado');

const Comision = sequelize.define('Comision', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Empleado, key: 'id' }
  },
  monto: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  mes: {
    type: DataTypes.STRING, // Ej: "OCTUBRE 2025"
    allowNull: false,
  },
  fecha_pago: {
    type: DataTypes.DATEONLY, // Fecha en que se aplica esta comisión
    allowNull: false,
  }
});

module.exports = Comision;
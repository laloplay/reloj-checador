const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Empleado = require('./Empleado');

const Deduccion = sequelize.define('Deduccion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Empleado, key: 'id' }
  },
  monto: {
    type: DataTypes.FLOAT, // Guardar como número positivo
    allowNull: false,
  },
  motivo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fecha_pago: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  }
});

module.exports = Deduccion;
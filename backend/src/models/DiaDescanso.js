const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Empleado = require('./Empleado');

const DiaDescanso = sequelize.define('DiaDescanso', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Empleado,
      key: 'id'
    }
    // unique: true <-- BORRAMOS ESTA LÍNEA
  },
  dia_semana: {
    type: DataTypes.INTEGER, // 0 = Domingo, 1 = Lunes, etc.
    allowNull: false,
  }
}, {
  timestamps: false
});

module.exports = DiaDescanso;
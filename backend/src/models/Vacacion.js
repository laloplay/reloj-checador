const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Empleado = require('./Empleado');

const Vacacion = sequelize.define('Vacacion', {
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
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  fecha_fin: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  }
});

module.exports = Vacacion;
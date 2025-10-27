const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Empleado = require('./Empleado');

const Permiso = sequelize.define('Permiso', {
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
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  motivo: {
    type: DataTypes.STRING,
    allowNull: true, // El motivo es opcional
  }
});

module.exports = Permiso;
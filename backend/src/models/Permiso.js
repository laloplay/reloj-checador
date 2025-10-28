const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Empleado = require('./Empleado');
const MotivoPermiso = require('./MotivoPermiso');

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
  fecha_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  fecha_fin: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  motivoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: MotivoPermiso,
      key: 'id'
    }
  }
});

module.exports = Permiso;
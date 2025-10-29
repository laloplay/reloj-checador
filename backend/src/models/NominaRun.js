const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const NominaRun = sequelize.define('NominaRun', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
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

module.exports = NominaRun;
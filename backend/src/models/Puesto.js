// backend/src/models/Puesto.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Puesto = sequelize.define('Puesto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Para no tener puestos repetidos
  },
  salarioDiario: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.0,
  },
});

module.exports = Puesto;
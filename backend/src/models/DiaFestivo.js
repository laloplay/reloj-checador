const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const DiaFestivo = sequelize.define('DiaFestivo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fecha: {
    type: DataTypes.DATEONLY, // Solo guarda la fecha (YYYY-MM-DD)
    allowNull: false,
    unique: true, // No puede haber dos festivos el mismo día
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  timestamps: false // No necesitamos createdAt/updatedAt aquí
});

module.exports = DiaFestivo;
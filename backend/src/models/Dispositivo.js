// backend/src/models/Dispositivo.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Sucursal = require('./Sucursal');

const Dispositivo = sequelize.define('Dispositivo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fingerprint: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  nombre: {
    type: DataTypes.STRING,
    defaultValue: 'Nuevo Dispositivo',
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  sucursalId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Sucursal,
      key: 'id'
    }
  },
});

// ¡La línea que estaba aquí (Dispositivo.belongsTo...) se elimina!

module.exports = Dispositivo;
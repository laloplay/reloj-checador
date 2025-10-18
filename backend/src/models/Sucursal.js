// backend/src/models/Sucursal.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Sucursal = sequelize.define('Sucursal', {
  nombre: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true, // ✅ AÑADE ESTA LÍNEA
  },
});

module.exports = Sucursal;
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const MotivoPermiso = sequelize.define('MotivoPermiso', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  }
}, {
  timestamps: false
});

module.exports = MotivoPermiso;
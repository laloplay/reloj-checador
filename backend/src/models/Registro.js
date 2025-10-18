// backend/src/models/Registro.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Empleado = require('./Empleado'); // Importamos para la relación

const Registro = sequelize.define('Registro', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW, // La hora se guarda automáticamente
  },
  type: {
    type: DataTypes.ENUM('ENTRADA', 'SALIDA'),
    allowNull: false,
  },
  // Este campo crea la relación con la tabla Empleado
  employeeId: {
    type: DataTypes.INTEGER,
    references: {
      model: Empleado,
      key: 'id'
    }
  }
});

// Definimos la relación
Empleado.hasMany(Registro, { foreignKey: 'employeeId' });
Registro.belongsTo(Empleado, { foreignKey: 'employeeId' });

module.exports = Registro;
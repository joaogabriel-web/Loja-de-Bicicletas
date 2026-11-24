import { Sequelize } from 'sequelize';
import db from '../config/database.js';

const Bicicleta = db.define('bicicletas', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    codigo: {
        type: Sequelize.STRING,
        allowNull: false
    },
    quadro: {
        type: Sequelize.STRING,
        allowNull: false
    },
    cor: {
        type: Sequelize.STRING,
        allowNull: false
    }
},
{
    timestamps: false,
    freezeTableName: true
})

export default Bicicleta;
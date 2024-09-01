import sequelize from '../clients/sequelize.mysql.js';
import { DataTypes, Model } from 'sequelize';



class Favorites extends Model {}


Favorites.init(
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,

        },

    },
    {
        sequelize,
        timestamps: true,
        modelName: 'Favorites',
        tableName: 'favorites',

    }

)


export default Favorites;
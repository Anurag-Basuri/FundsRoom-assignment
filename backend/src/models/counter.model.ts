import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

export interface CounterAttributes {
  id: number;
  year: number;
  last_value: number;
}

interface CounterCreationAttributes extends Optional<CounterAttributes, 'id'> {}

class Counter extends Model<CounterAttributes, CounterCreationAttributes> implements CounterAttributes {
  public id!: number;
  public year!: number;
  public last_value!: number;
}

Counter.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    last_value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'counters',
    timestamps: false,
  }
);

export default Counter;

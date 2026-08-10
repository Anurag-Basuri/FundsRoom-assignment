import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

export interface StockMovementAttributes {
  id: string;
  product_id: string;
  quantity_changed: number;
  movement_type: 'IN' | 'OUT';
  reason: string;
  created_by: string;
  created_at?: Date;
}

interface StockMovementCreationAttributes extends Optional<StockMovementAttributes, 'id' | 'created_at'> {}

class StockMovement extends Model<StockMovementAttributes, StockMovementCreationAttributes> implements StockMovementAttributes {
  public id!: string;
  public product_id!: string;
  public quantity_changed!: number;
  public movement_type!: 'IN' | 'OUT';
  public reason!: string;
  public created_by!: string;
  public readonly created_at!: Date;
}

StockMovement.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    quantity_changed: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    movement_type: {
      type: DataTypes.ENUM('IN', 'OUT'),
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'stock_movements',
    timestamps: true,
    underscored: true,
    updatedAt: false,
  }
);

export default StockMovement;

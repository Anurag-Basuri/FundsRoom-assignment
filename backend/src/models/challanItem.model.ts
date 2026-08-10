import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

export interface ChallanItemAttributes {
  id: string;
  challan_id: string;
  product_id: string;
  product_name_snapshot: string;
  sku_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
}

interface ChallanItemCreationAttributes extends Optional<ChallanItemAttributes, 'id'> {}

class ChallanItem extends Model<ChallanItemAttributes, ChallanItemCreationAttributes> implements ChallanItemAttributes {
  public id!: string;
  public challan_id!: string;
  public product_id!: string;
  public product_name_snapshot!: string;
  public sku_snapshot!: string;
  public unit_price_snapshot!: number;
  public quantity!: number;
}

ChallanItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    challan_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    product_name_snapshot: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    sku_snapshot: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    unit_price_snapshot: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
  },
  {
    sequelize,
    tableName: 'challan_items',
    timestamps: false,
    underscored: true,
  }
);

export default ChallanItem;

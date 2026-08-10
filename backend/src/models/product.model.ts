import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

export interface ProductAttributes {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  unit_price: number;
  current_stock: number;
  min_stock_alert: number;
  location: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'category' | 'current_stock' | 'min_stock_alert' | 'location' | 'created_at' | 'updated_at'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: string;
  public name!: string;
  public sku!: string;
  public category!: string | null;
  public unit_price!: number;
  public current_stock!: number;
  public min_stock_alert!: number;
  public location!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    sku: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: true,
    },
    category: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    unit_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    current_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    min_stock_alert: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    location: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true,
    underscored: true,
  }
);

export default Product;

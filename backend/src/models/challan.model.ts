import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

export interface ChallanAttributes {
  id: string;
  challan_number: string;
  customer_id: string;
  status: 'Draft' | 'Confirmed' | 'Cancelled';
  total_quantity: number;
  total_amount: number;
  created_by: string;
  created_at?: Date;
  updated_at?: Date;
  confirmed_at: Date | null;
}

interface ChallanCreationAttributes extends Optional<ChallanAttributes, 'id' | 'status' | 'total_quantity' | 'total_amount' | 'confirmed_at' | 'created_at' | 'updated_at'> {}

class Challan extends Model<ChallanAttributes, ChallanCreationAttributes> implements ChallanAttributes {
  public id!: string;
  public challan_number!: string;
  public customer_id!: string;
  public status!: 'Draft' | 'Confirmed' | 'Cancelled';
  public total_quantity!: number;
  public total_amount!: number;
  public created_by!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public confirmed_at!: Date | null;

  // Associations
  public readonly items?: import('./challanItem.model').default[];
  public readonly customer?: import('./customer.model').default;
  public readonly creator?: import('./user.model').default;
}

Challan.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    challan_number: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Confirmed', 'Cancelled'),
      defaultValue: 'Draft',
    },
    total_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    total_amount: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'challans',
    timestamps: true,
    underscored: true,
  }
);

export default Challan;

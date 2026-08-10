import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

export interface CustomerAttributes {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  business_name: string | null;
  gst_number: string | null;
  customer_type: 'Retail' | 'Wholesale' | 'Distributor';
  address: string | null;
  status: 'Lead' | 'Active' | 'Inactive';
  follow_up_date: Date | null;
  notes: string | null;
  created_by: string;
  created_at?: Date;
  updated_at?: Date;
}

interface CustomerCreationAttributes extends Optional<CustomerAttributes, 'id' | 'email' | 'business_name' | 'gst_number' | 'address' | 'status' | 'follow_up_date' | 'notes' | 'created_at' | 'updated_at'> {}

class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> implements CustomerAttributes {
  public id!: string;
  public name!: string;
  public mobile!: string;
  public email!: string | null;
  public business_name!: string | null;
  public gst_number!: string | null;
  public customer_type!: 'Retail' | 'Wholesale' | 'Distributor';
  public address!: string | null;
  public status!: 'Lead' | 'Active' | 'Inactive';
  public follow_up_date!: Date | null;
  public notes!: string | null;
  public created_by!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Customer.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    business_name: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    gst_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    customer_type: {
      type: DataTypes.ENUM('Retail', 'Wholesale', 'Distributor'),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Lead', 'Active', 'Inactive'),
      defaultValue: 'Lead',
    },
    follow_up_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'customers',
    timestamps: true,
    underscored: true,
  }
);

export default Customer;

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

export interface UserAttributes {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'is_active' | 'created_at' | 'updated_at'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public name!: string;
  public email!: string;
  public password_hash!: string;
  public role!: 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public toSafeJSON(): Omit<UserAttributes, 'password_hash'> {
    const { password_hash, ...safeUser } = this.toJSON();
    return safeUser;
  }
}

User.init(
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
    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('Admin', 'Sales', 'Warehouse', 'Accounts'),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
  }
);

export default User;

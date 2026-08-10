import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

export interface FollowUpAttributes {
  id: string;
  customer_id: string;
  note: string;
  follow_up_date: Date | null;
  created_by: string;
  created_at?: Date;
}

interface FollowUpCreationAttributes extends Optional<FollowUpAttributes, 'id' | 'follow_up_date' | 'created_at'> {}

class FollowUp extends Model<FollowUpAttributes, FollowUpCreationAttributes> implements FollowUpAttributes {
  public id!: string;
  public customer_id!: string;
  public note!: string;
  public follow_up_date!: Date | null;
  public created_by!: string;
  public readonly created_at!: Date;
}

FollowUp.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    follow_up_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'follow_ups',
    timestamps: true,
    underscored: true,
    updatedAt: false,
  }
);

export default FollowUp;

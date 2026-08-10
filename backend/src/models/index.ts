import User from './user.model';
import Customer from './customer.model';
import FollowUp from './followUp.model';
import Product from './product.model';
import StockMovement from './stockMovement.model';
import Challan from './challan.model';
import ChallanItem from './challanItem.model';
import Counter from './counter.model';

// ── User Associations ──
User.hasMany(Customer, { foreignKey: 'created_by', as: 'customers' });
User.hasMany(FollowUp, { foreignKey: 'created_by', as: 'followUps' });
User.hasMany(StockMovement, { foreignKey: 'created_by', as: 'stockMovements' });
User.hasMany(Challan, { foreignKey: 'created_by', as: 'challans' });

// ── Customer Associations ──
Customer.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Customer.hasMany(FollowUp, { foreignKey: 'customer_id', as: 'followUps' });
Customer.hasMany(Challan, { foreignKey: 'customer_id', as: 'challans' });

// ── FollowUp Associations ──
FollowUp.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
FollowUp.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ── Product Associations ──
Product.hasMany(StockMovement, { foreignKey: 'product_id', as: 'stockMovements' });
Product.hasMany(ChallanItem, { foreignKey: 'product_id', as: 'challanItems' });

// ── StockMovement Associations ──
StockMovement.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
StockMovement.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ── Challan Associations ──
Challan.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Challan.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Challan.hasMany(ChallanItem, { foreignKey: 'challan_id', as: 'items', onDelete: 'CASCADE' });

// ── ChallanItem Associations ──
ChallanItem.belongsTo(Challan, { foreignKey: 'challan_id', as: 'challan' });
ChallanItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

export {
  User,
  Customer,
  FollowUp,
  Product,
  StockMovement,
  Challan,
  ChallanItem,
  Counter,
};

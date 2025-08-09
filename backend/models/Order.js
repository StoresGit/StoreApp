const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true },
  itemName: { type: String, required: true },
  unit: { type: String, required: true },
  category: { type: String, required: true },
  orderQty: { type: Number, required: true },
  status: { type: String, default: 'Draft' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  status: { 
    type: String, 
    enum: ['Draft', 'Under Review', 'Sent to CK', 'Shipped', 'Received', 'Rejected'], 
    default: 'Draft' 
  },
  orderNo: { type: String, required: true, unique: true },
  section: { type: String, required: true },
  userName: { type: String, required: true },
  dateTime: { type: Date, required: true },
  scheduleDate: { type: Date },
  items: [orderItemSchema],
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema); 
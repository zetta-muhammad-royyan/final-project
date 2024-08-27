// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  billing_id: {
    type: mongoose.Schema.Types.ObjectID,
    ref: 'billings',
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  payment_status: {
    type: String,
    enum: ['billed', 'paid', 'partial_paid'],
    default: 'billed',
  },
  amount_paid: {
    type: Number,
    required: true,
  },
  remaining_amount: {
    type: Number,
    required: true,
  },
});

const Deposit = mongoose.model('Deposit', depositSchema, 'deposits');

// *************** EXPORT MODULE ***************
module.exports = Deposit;

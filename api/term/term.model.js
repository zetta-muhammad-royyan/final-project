// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

const termSchema = new mongoose.Schema({
  billing_id: {
    type: mongoose.Schema.Types.ObjectID,
    ref: 'billings',
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

const Term = mongoose.model('Term', termSchema, 'terms');

// *************** EXPORT MODULE ***************
module.exports = Term;

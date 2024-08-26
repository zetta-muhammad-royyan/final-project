// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

const terminationOfPaymentSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  termination: {
    type: Number,
    required: true,
  },
  term_payments: [
    {
      payment_date: {
        type: String,
        required: true,
      },
      percentage: {
        type: Number,
        required: true,
      },
    },
  ],
  additional_cost: {
    type: Number,
    required: true,
  },
});

const TerminationOfPayment = mongoose.model('TerminationOfPayment', terminationOfPaymentSchema, 'termination_of_payments');

// *************** EXPORT MODULE ***************
module.exports = TerminationOfPayment;

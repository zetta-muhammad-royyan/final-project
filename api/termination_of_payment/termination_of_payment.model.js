const mongoose = require('mongoose');

const terminationOfPaymentsSchema = new mongoose.Schema({
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

const TerminationOfPayments = mongoose.model('TerminationOfPayments', terminationOfPaymentsSchema);

module.exports = TerminationOfPayments;

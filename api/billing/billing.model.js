// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectID,
    ref: 'students',
    required: true,
  },
  registration_profile_id: {
    type: mongoose.Schema.Types.ObjectID,
    ref: 'registration_profiles',
    required: true,
  },
  payer: {
    type: mongoose.Schema.Types.ObjectID,
    required: true,
  },
  total_amount: {
    type: Number,
    required: true,
  },
  paid_amount: {
    type: Number,
    required: true,
  },
  remaining_due: {
    type: Number,
    required: true,
  },
  deposit_id: {
    type: mongoose.Schema.Types.ObjectID,
    ref: 'deposit',
  },
  term_ids: [
    {
      type: mongoose.Schema.Types.ObjectID,
      ref: 'terms',
    },
  ],
});

const Billing = mongoose.model('Billing', billingSchema, 'billings');

// *************** EXPORT MODULE ***************
module.exports = Billing;

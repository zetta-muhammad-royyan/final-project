// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

const financialSupportSchema = new mongoose.Schema({
  civility: {
    type: String,
    enum: ['mr', 'mrs', 'neutral'],
    default: 'neutral',
  },
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectID,
    ref: 'students',
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active',
  },
});

const FinancialSupport = mongoose.model('FinancialSupport', financialSupportSchema, 'financial_supports');

// *************** EXPORT MODULE ***************
module.exports = FinancialSupport;

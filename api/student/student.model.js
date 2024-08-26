// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
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
  financial_support_ids: [
    {
      type: mongoose.Schema.Types.ObjectID,
      ref: 'financial_supports',
      required: true,
    },
  ],
  registration_profile_id: {
    type: mongoose.Schema.Types.ObjectID,
    ref: 'registration_profiles',
    required: true,
  },
});

const Student = mongoose.model('Student', studentSchema, 'students');

// *************** EXPORT MODULE ***************
module.exports = Student;

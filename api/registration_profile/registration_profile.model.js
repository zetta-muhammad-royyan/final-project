// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

const registrationProfileSchema = new mongoose.Schema({
  registration_profile_name: {
    type: String,
    required: true,
  },
  scholarship_fee: {
    type: Number,
    required: true,
  },
  deposit: {
    type: Number,
    required: true,
  },
  registration_fee: {
    type: Number,
    required: true,
  },
  termination_of_payment_id: {
    type: mongoose.Schema.Types.ObjectID,
    ref: 'termination_of_payments',
    required: true,
  },
});

const RegistrationProfile = mongoose.model('RegistrationProfile', registrationProfileSchema, 'registration_profiles');

// *************** EXPORT MODULE ***************
module.exports = RegistrationProfile;

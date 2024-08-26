const mongoose = require('mongoose');

const registrationProfilesSchema = new mongoose.Schema({
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
    ref: 'terminationofpayments',
    required: true,
  },
});

const RegistrationProfiles = mongoose.model('RegistrationProfiles', registrationProfilesSchema);

module.exports = RegistrationProfiles;

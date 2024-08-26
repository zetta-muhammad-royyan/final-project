// *************** Import library ***************
const mongoose = require('mongoose');

// *************** Import module ***************
const RegistrationProfiles = require('../models/registrationProfiles');

// *************** Import utils ***************
const { isNumber, isString } = require('../utils/primitiveTypes');

const registrationProfilesResolver = {
  Query: {},
  Mutation: {
    /**
     * Create new RegistrationProfiles document
     * @param {Object} _parent - Parent object, unused in this resolver.
     * @param {Object} args - arguments for the mutation
     * @param {String} args.registration_profile_name
     * @param {Float} args.scholarship_fee
     * @param {Float} args.deposit
     * @param {Float} args.registration_fee
     * @param {String} args.termination_of_payment_id
     */
    CreateRegistrationProfile: async (_parent, args) => {
      if (
        !isString(args.registration_profile_name) &&
        !isNumber(args.scholarship_fee) &&
        !isNumber(args.deposit) &&
        !isNumber(args.registration_fee)
      ) {
        throw new Error('the arguments submitted do not meet the requirements');
      }

      if (!mongoose.Types.ObjectId.isValid(args.termination_of_payment_id)) {
        throw new Error('Invalid ID format');
      }

      try {
        const newRegistrationProfile = new RegistrationProfiles({
          registration_profile_name: args.registration_profile_name,
          scholarship_fee: args.scholarship_fee,
          deposit: args.deposit,
          registration_fee: args.registration_fee,
          termination_of_payment_id: args.termination_of_payment_id,
        });

        return await newRegistrationProfile.save();
      } catch (error) {
        throw new Error(`Failed to create RegistrationProfiles: ${error.message}`);
      }
    },
  },
};

module.exports = registrationProfilesResolver;

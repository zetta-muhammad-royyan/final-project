// *************** Import library ***************
const mongoose = require('mongoose');

// *************** Import module ***************
const RegistrationProfiles = require('./registration_profile.model');

// *************** Import utils ***************
const { isNumber, isString } = require('../../utils/primitiveTypes');

const registrationProfilesResolver = {
  Query: {
    /**
     * Retrieve all RegistrationProfiles with optional filter and sorting
     * @param {Object} _parent
     * @param {Object} args
     * @param {Object} args.filter
     * @param {String} args.filter.registration_profile_name
     * @param {String} args.filter.termination_of_payment_id
     * @param {Object} args.sort
     * @param {String} args.sort.registration_profile_name
     * @param {String} args.sort.termination_of_payment_id
     * @param {Object} args.pagination
     * @param {Int} args.pagination.page
     * @param {Int} args.pagination.limit
     * @returns {Promise<Object>}
     */
    GetAllRegistrationProfiles: async (_parent, { filter, sort, pagination }) => {
      try {
        const { page = 1, limit = 10 } = pagination;
        if (page < 1 || limit < 1) {
          throw new Error('Page and limit must be greater than 0');
        }

        const pipeline = [];

        const matchStage = {};
        if (filter) {
          if (filter.registration_profile_name !== undefined) {
            matchStage.registration_profile_name = { $regex: filter.registration_profile_name, $options: 'i' };
          }
          if (filter.termination_of_payment_id !== undefined) {
            matchStage.termination_of_payment_id = filter.termination_of_payment_id;
          }

          pipeline.push({ $match: matchStage });
        }

        const sortStage = {};
        if (sort) {
          if (sort.registration_profile_name !== undefined) {
            sortStage.registration_profile_name = sort.registration_profile_name;
          }
          if (sort.termination_of_payment_id !== undefined) {
            sortStage.termination_of_payment_id = sort.termination_of_payment_id;
          }

          pipeline.push({ $sort: sortStage });
        }

        pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

        return await RegistrationProfiles.aggregate(pipeline);
      } catch (error) {
        throw new Error(`Failed to fetch RegistrationProfiles: ${error.message}`);
      }
    },
  },
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
     * @returns {Promise<Object>}
     */
    CreateRegistrationProfile: async (_parent, args) => {
      try {
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

    /**
     * Update RegistrationProfiles document
     * @param {Object} _parent
     * @param {Object} args
     * @param {String} args._id
     * @param {String} args.registration_profile_name
     * @param {Float} args.scholarship_fee
     * @param {Float} args.deposit
     * @param {Float} args.registration_fee
     * @param {String} args.termination_of_payment_id
     * @returns {Promise<Object>}
     */
    UpdateRegistrationProfile: async (_parent, args) => {
      try {
        if (
          !isString(args.registration_profile_name) &&
          !isNumber(args.scholarship_fee) &&
          !isNumber(args.deposit) &&
          !isNumber(args.registration_fee)
        ) {
          throw new Error('the arguments submitted do not meet the requirements');
        }

        if (!mongoose.Types.ObjectId.isValid(args._id)) {
          throw new Error('Invalid ID format');
        }

        const updatedRegistrationProfiles = await RegistrationProfiles.findByIdAndUpdate(
          args._id,
          {
            $set: {
              registration_profile_name: args.registration_profile_name,
              scholarship_fee: args.scholarship_fee,
              deposit: args.deposit,
              registration_fee: args.registration_fee,
              termination_of_payment_id: args.termination_of_payment_id,
            },
          },
          { new: true }
        );

        return updatedRegistrationProfiles;
      } catch (error) {
        throw new Error(`Failed to update RegistrationProfiles: ${error.message}`);
      }
    },

    /**
     * Delete RegistrationProfiles documnent
     * @param {Object} _parent
     * @param {Object} args
     * @param {String} args._id
     * @returns {Promise<Object>}
     */
    DeleteRegistrationProfile: async (_parent, args) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(args._id)) {
          throw new Error('Invalid ID format');
        }

        const deletedRegistrationProfiles = await RegistrationProfiles.findByIdAndDelete(args._id);
        if (!deletedRegistrationProfiles) {
          throw new Error('RegistrationProfiles not found');
        }

        return 'RegistrationProfiles deleted successfully';
      } catch (error) {
        throw new Error(`Failed to delete RegistrationProfiles: ${error.message}`);
      }
    },
  },
};

module.exports = registrationProfilesResolver;

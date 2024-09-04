// *************** IMPORT MODULE ***************
const RegistrationProfile = require('./registration_profile.model');

// *************** IMPORT UTILITIES ***************
const { CheckObjectId, ConvertToObjectId } = require('../../utils/mongoose.utils');
const { AmountMustHaveMaxTwoDecimal, AmountCannotBeMinus } = require('../../utils/monetary.utils');
const { TrimString } = require('../../utils/string.utils');
const { IsEmptyString } = require('../../utils/sanity.utils');

// *************** IMPORT HELPER FUNCTION ***************
const {
  CreatePipelineMatchStage,
  CreatePipelineSortStage,
  CheckIfRegistrationProfileUsedByBilling,
  CheckIfRegistrationProfileUsedByStudent,
} = require('./registration_profile.helper');

// *************** IMPORT VALIDATOR ***************
const { ValidatePagination } = require('./registration_profile.validator');

// *************** QUERY ***************

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
const GetAllRegistrationProfiles = async (_parent, { filter, sort, pagination }) => {
  try {
    const { page = 1, limit = 10 } = pagination;
    ValidatePagination(page, limit);

    //*************** base pipeline
    const pipeline = [];

    //*************** $match stage, only active when filter contain data
    const matchStage = CreatePipelineMatchStage(filter);
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    //*************** $sort stage, only active when sort contain data
    const sortStage = CreatePipelineSortStage(sort);
    if (Object.keys(sortStage).length > 0) {
      pipeline.push({ $sort: sortStage });
    }

    //*************** pagination pipeline, with $skip and $limit
    pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

    const registrationProfiles = await RegistrationProfile.aggregate(pipeline);

    return registrationProfiles;
  } catch (error) {
    throw new Error(`Failed to fetch RegistrationProfiles: ${error.message}`);
  }
};

/**
 * Get one RegistrationDocument by id
 * @param {Object} _parent
 * @param {Object} args
 * @param {String} args._id
 * @param {Object} context
 * @param {Object} context.models
 * @param {import('./registration_profile.model').default} context.models.registrationProfile
 * @returns {Promise<Object>}
 */
const GetOneRegistrationProfile = async (_parent, args, { models }) => {
  try {
    CheckObjectId(args._id);

    const registrationProfile = await models.registrationProfile.findById(args._id);
    if (!registrationProfile) {
      throw new Error('RegistrationProfile not found');
    }

    return registrationProfile;
  } catch (error) {
    throw new Error(`Failed to fetch RegistrationProfiles: ${error.message}`);
  }
};

// *************** MUTATION ***************

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
const CreateRegistrationProfile = async (_parent, args) => {
  try {
    if (IsEmptyString(args.registration_profile_name)) {
      throw new Error('registration profile name cannot be empty string');
    }

    CheckObjectId(args.termination_of_payment_id);

    //*************** only two decimal allowed
    AmountMustHaveMaxTwoDecimal(args.scholarship_fee);
    AmountMustHaveMaxTwoDecimal(args.deposit);
    AmountMustHaveMaxTwoDecimal(args.registration_fee);

    //*************** amount cannot be minus
    AmountCannotBeMinus(args.scholarship_fee);
    AmountCannotBeMinus(args.deposit);
    AmountCannotBeMinus(args.registration_fee);

    const newRegistrationProfile = new RegistrationProfile({
      registration_profile_name: TrimString(args.registration_profile_name),
      scholarship_fee: args.scholarship_fee,
      deposit: args.deposit,
      registration_fee: args.registration_fee,
      termination_of_payment_id: args.termination_of_payment_id,
    });

    const updatedRegistrationProfile = await newRegistrationProfile.save();

    return updatedRegistrationProfile;
  } catch (error) {
    throw new Error(`Failed to create RegistrationProfiles: ${error.message}`);
  }
};

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
const UpdateRegistrationProfile = async (_parent, args) => {
  try {
    if (IsEmptyString(args.registration_profile_name)) {
      throw new Error('registration profile name cannot be empty string');
    }

    CheckObjectId(args._id);

    //*************** only two decimal allowed
    AmountMustHaveMaxTwoDecimal(args.scholarship_fee);
    AmountMustHaveMaxTwoDecimal(args.deposit);
    AmountMustHaveMaxTwoDecimal(args.registration_fee);

    //*************** amount cannot be minus
    AmountCannotBeMinus(args.scholarship_fee);
    AmountCannotBeMinus(args.deposit);
    AmountCannotBeMinus(args.registration_fee);

    //*************** cannot update registration profile if already used by billing
    const usedByBilling = await CheckIfRegistrationProfileUsedByBilling(args._id);
    if (usedByBilling) {
      throw new Error('cannot update registration profile because already used by billing');
    }

    const updatedRegistrationProfiles = await RegistrationProfile.findByIdAndUpdate(
      args._id,
      {
        $set: {
          registration_profile_name: TrimString(args.registration_profile_name),
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
};

/**
 * Delete RegistrationProfiles documnent
 * @param {Object} _parent
 * @param {Object} args
 * @param {String} args._id
 * @returns {Promise<Object>}
 */
const DeleteRegistrationProfile = async (_parent, args) => {
  try {
    CheckObjectId(args._id);

    //*************** cannot delete registration profile if already used by student
    const usedByStudent = await CheckIfRegistrationProfileUsedByStudent(args._id);
    if (usedByStudent) {
      throw new Error('cannot delete registration profile because already used by student');
    }

    //*************** cannot delete registration profile if already used by billing
    const usedByBilling = await CheckIfRegistrationProfileUsedByBilling(args._id);
    if (usedByBilling) {
      throw new Error('cannot delete registration profile because already used by billing');
    }

    const deletedRegistrationProfile = await RegistrationProfile.deleteOne({ _id: ConvertToObjectId(args._id) });
    if (deletedRegistrationProfile.deletedCount !== 1) {
      throw new Error('RegistrationProfiles not found');
    }

    return 'RegistrationProfiles deleted successfully';
  } catch (error) {
    throw new Error(`Failed to delete RegistrationProfiles: ${error.message}`);
  }
};

// *************** LOADER ***************

/**
 * Fetches the termination of payment details based on the provided parent object's `termination_of_payment_id`.
 * @function termination_of_payment
 * @param {Object} parent - The parent object containing the `termination_of_payment_id`.
 * @param {Object} _args - Arguments provided by GraphQL resolver, not used in this function.
 * @param {Object} context - The context object, which contains various loaders.
 * @param {Object} context.loaders - The loaders object containing DataLoader instances.
 * @returns {Promise<Object>} A promise that resolves to the termination of payment details loaded by DataLoader.
 */
const GetTerminationOfPayment = (parent, _args, { loaders }) => {
  return loaders.terminationOfPaymentLoader.load(parent.termination_of_payment_id);
};

const registrationProfileResolver = {
  Query: {
    GetAllRegistrationProfiles,
    GetOneRegistrationProfile,
  },

  Mutation: {
    CreateRegistrationProfile,
    UpdateRegistrationProfile,
    DeleteRegistrationProfile,
  },

  RegistrationProfile: {
    termination_of_payment: GetTerminationOfPayment,
  },
};

// *************** EXPORT MODULE ***************
module.exports = registrationProfileResolver;

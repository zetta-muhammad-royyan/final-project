// *************** IMPORT MODULE ***************
const RegistrationProfile = require('../registration_profile/registration_profile.model');
const Billing = require('../billing/billing.model');

// *************** IMPORT UTILITIES ***************
const { ConvertToObjectId } = require('../../utils/mongoose.utils');
const { IsSortingInput } = require('../../utils/sanity.utils');

/**
 * @param {Object} filter
 * @param {string} filter.description
 * @param {number} filter.termination
 * @returns {Object}
 */
const CreatePipelineMatchStage = (filter) => {
  const matchStage = {};
  if (filter) {
    if (filter.description) {
      matchStage.description = { $regex: filter.description, $options: 'i' };
    }

    if (filter.termination) {
      matchStage.termination = filter.termination;
    }
  }

  return matchStage;
};

/**
 * @param {Object} sort
 * @param {number} sort.description
 * @param {number} sort.termination
 * @returns {Object}
 */
const CreateSortPipeline = (sort) => {
  try {
    const sortStage = {};
    if (sort) {
      if (sort.description) {
        if (!IsSortingInput(sort.description)) {
          throw new Error('the sorting input must be 1 for ascending or -1 for descending');
        }

        sortStage.description = sort.description;
      }
      if (sort.termination) {
        if (!IsSortingInput(sort.termination)) {
          throw new Error('the sorting input must be 1 for ascending or -1 for descending');
        }

        sortStage.termination = sort.termination;
      }
    }

    return sortStage;
  } catch (error) {
    throw new Error(`CreateSortPipeline error: ${error.message}`);
  }
};

/**
 * Check if termination of payment already used by registration profile
 * @param {string} terminationOfPaymentId
 * @return {boolean}
 */
const CheckIfTerminationOfPaymentUsedByRegistrationProfile = async (terminationOfPaymentId) => {
  try {
    const registrationProfileExists = await RegistrationProfile.countDocuments({
      termination_of_payment_id: ConvertToObjectId(terminationOfPaymentId),
    });

    return registrationProfileExists > 0;
  } catch (error) {
    throw new Error(`CheckIfTerminationOfPaymentUsedByRegistrationProfile error: ${error.message}`);
  }
};

/**
 * check if termination of payment already used by billing
 * @param {string} terminationOfPaymentId
 * @returns {number}
 */
const CheckIfTerminationOfPaymentUsedByBilling = async (terminationOfPaymentId) => {
  try {
    const registrationProfile = await RegistrationProfile.findOne(
      { termination_of_payment_id: ConvertToObjectId(terminationOfPaymentId) },
      { _id: 1 }
    );

    if (!registrationProfile) {
      return false;
    }

    const billingExist = await Billing.countDocuments({
      registration_profile_id: ConvertToObjectId(registrationProfile._id),
    });

    return billingExist > 0;
  } catch (error) {
    throw new Error(`CheckIfTerminationOfPaymentUsedByBilling error: ${error.message}`);
  }
};

module.exports = {
  CreatePipelineMatchStage,
  CreateSortPipeline,
  CheckIfTerminationOfPaymentUsedByRegistrationProfile,
  CheckIfTerminationOfPaymentUsedByBilling,
};

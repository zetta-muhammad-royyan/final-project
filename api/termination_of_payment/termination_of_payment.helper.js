// *************** IMPORT MODULE ***************
const RegistrationProfile = require('../registration_profile/registration_profile.model');
const Billing = require('../billing/billing.model');

// *************** IMPORT UTILITIES ***************
const { ConvertToObjectId } = require('../../utils/mongoose.utils');

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
    if (filter.termination !== undefined) {
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
  const sortStage = {};
  if (sort) {
    if (sort.description !== undefined) {
      sortStage.description = sort.description;
    }
    if (sort.termination !== undefined) {
      sortStage.termination = sort.termination;
    }
  }

  return sortStage;
};

/**
 * Check if termination of payment already used by registration profile
 * @param {string} terminationOfPaymentId
 * @return {boolean}
 */
const CheckIfTerminationOfPaymentUsedByRegistrationProfile = async (terminationOfPaymentId) => {
  const registrationProfileExists = await RegistrationProfile.countDocuments({
    termination_of_payment_id: ConvertToObjectId(terminationOfPaymentId),
  });

  return registrationProfileExists > 0;
};

/**
 * check if termination of payment already used by billing
 * @param {string} terminationOfPaymentId
 * @returns {number}
 */
const CheckIfTerminationOfPaymentUsedByBilling = async (terminationOfPaymentId) => {
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
};

module.exports = {
  CreatePipelineMatchStage,
  CreateSortPipeline,
  CheckIfTerminationOfPaymentUsedByRegistrationProfile,
  CheckIfTerminationOfPaymentUsedByBilling,
};

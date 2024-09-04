// *************** IMPORT MODULE ***************
const Billing = require('../billing/billing.model');
const Student = require('../student/student.model');

// *************** IMPORT UTILITIES ***************
const { ConvertToObjectId } = require('../../utils/mongoose.utils');
const { IsSortingInput } = require('../../utils/sanity.utils');

/**
 * @param {Object} filter
 * @param {string} filter.registration_profile_name
 * @param {string} filter.termination_of_payment_id
 * @returns {Object}
 */
const CreatePipelineMatchStage = (filter) => {
  const matchStage = {};
  if (filter) {
    if (filter.registration_profile_name) {
      matchStage.registration_profile_name = { $regex: filter.registration_profile_name, $options: 'i' };
    }

    if (filter.termination_of_payment_id) {
      matchStage.termination_of_payment_id = ConvertToObjectId(filter.termination_of_payment_id);
    }
  }

  return matchStage;
};

/**
 * @param {Object} sort
 * @param {number} sort.registration_profile_name
 * @param {number} sort.termination_of_payment_id
 */
const CreatePipelineSortStage = (sort) => {
  const sortStage = {};
  if (sort) {
    if (sort.registration_profile_name) {
      if (!IsSortingInput(sort.registration_profile_name)) {
        throw new Error('the sorting input must be 1 for ascending or -1 for descending');
      }

      sortStage.registration_profile_name = sort.registration_profile_name;
    }

    if (sort.termination_of_payment_id) {
      if (!IsSortingInput(sort.termination_of_payment_id)) {
        throw new Error('the sorting input must be 1 for ascending or -1 for descending');
      }

      sortStage.termination_of_payment_id = sort.termination_of_payment_id;
    }
  }

  return sortStage;
};

/**
 * check if registration profile already used by student
 * @param {string} registrationProfileId
 * @returns {boolean}
 */
const CheckIfRegistrationProfileUsedByStudent = async (registrationProfileId) => {
  const studentExist = await Student.countDocuments({ registration_profile_id: ConvertToObjectId(registrationProfileId) });

  return studentExist > 0;
};

/**
 * check if registration profile already used by billing
 * @param {string} registrationProfileId
 * @returns {boolean}
 */
const CheckIfRegistrationProfileUsedByBilling = async (registrationProfileId) => {
  const billingExist = await Billing.countDocuments({ registration_profile_id: ConvertToObjectId(registrationProfileId) });

  return billingExist > 0;
};

module.exports = {
  CreatePipelineMatchStage,
  CreatePipelineSortStage,
  CheckIfRegistrationProfileUsedByBilling,
  CheckIfRegistrationProfileUsedByStudent,
};

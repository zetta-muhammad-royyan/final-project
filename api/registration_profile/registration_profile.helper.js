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
 * @param {number} sort.termination_of_payment_description
 */
const CreatePipelineSortStage = (sort) => {
  try {
    const sortStage = {};
    if (sort) {
      if (sort.registration_profile_name) {
        if (!IsSortingInput(sort.registration_profile_name)) {
          throw new Error('the sorting input must be 1 for ascending or -1 for descending');
        }

        sortStage.registration_profile_name = sort.registration_profile_name;
      }

      if (sort.termination_of_payment_description) {
        if (!IsSortingInput(sort.termination_of_payment_description)) {
          throw new Error('the sorting input must be 1 for ascending or -1 for descending');
        }

        sortStage['termination_of_payment.description'] = sort.termination_of_payment_description;
      }
    }

    return sortStage;
  } catch (error) {
    throw new Error(`CreatePipelineSortStage error: ${error.message}`);
  }
};

/**
 * Create $lookup and $unwind stages for MongoDB aggregation pipeline.
 * @param {string} from - The name of the collection to perform the $lookup on.
 * @param {string} localField - The local field to perform the $lookup with.
 * @param {string} foreignField - The foreign field to perform the $lookup with.
 * @param {string} as - The name of the new array field to add to the input documents.
 * @returns {Array<{ $lookup: { from: string, localField: string, foreignField: string, as: string } } | { $unwind: { path: string, preserveNullAndEmptyArrays: boolean } }>}
 */
const CreateLookupPipelineStage = (from, localField, foreignField, as) => {
  //*************** Create $lookup stage
  const lookupStage = {
    $lookup: {
      from,
      localField,
      foreignField,
      as,
    },
  };

  //*************** Create $unwind stage
  const unwindStage = {
    $unwind: {
      path: `$${as}`,
      preserveNullAndEmptyArrays: true,
    },
  };

  return [lookupStage, unwindStage];
};

/**
 * @param {string} field1
 * @param {string} field2
 * @param {string} separator
 * @returns {{$concat: Array<string>}}
 */
const CreateConcatPipelineStage = (field1, field2, separator = ' ') => {
  return { $concat: [field1, separator, field2] };
};

/**
 * check if registration profile already used by student
 * @param {string} registrationProfileId
 * @returns {boolean}
 */
const CheckIfRegistrationProfileUsedByStudent = async (registrationProfileId) => {
  try {
    //*************** check if registation profile already used by student by counting student document who has specific registation profile id
    const studentExist = await Student.countDocuments({
      registration_profile_id: ConvertToObjectId(registrationProfileId),
      status: 'active',
    });

    return studentExist > 0;
  } catch (error) {
    throw new Error(`CheckIfRegistrationProfileUsedByStudent: ${error.message}`);
  }
};

/**
 * check if registration profile already used by billing
 * @param {string} registrationProfileId
 * @returns {boolean}
 */
const CheckIfRegistrationProfileUsedByBilling = async (registrationProfileId) => {
  try {
    //*************** check if registation profile already used by billing by counting billing document who has specific registation profile id
    const billingExist = await Billing.countDocuments({ registration_profile_id: ConvertToObjectId(registrationProfileId) });

    return billingExist > 0;
  } catch (error) {
    throw new Error(`CheckIfRegistrationProfileUsedByBilling: ${error.message}`);
  }
};

module.exports = {
  CreatePipelineMatchStage,
  CreatePipelineSortStage,
  CheckIfRegistrationProfileUsedByBilling,
  CheckIfRegistrationProfileUsedByStudent,
  CreateLookupPipelineStage,
  CreateConcatPipelineStage,
};

// *************** IMPORT MODULE ***************
const Billing = require('../billing/billing.model');

// *************** IMPORT UTILITIES ***************
const { ConvertToObjectId } = require('../../utils/mongoose.utils');
const { IsSortingInput } = require('../../utils/sanity.utils');

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
 * @param {Object} sort
 * @param {string} sort.registration_profile_name
 * @param {string} sort.registration_profile_id
 * @param {string} sort.financial_support_full_name
 * @return {Object}
 */
const CreateSortPipelineStage = (sort) => {
  try {
    const sortStage = {};
    if (sort) {
      if (sort.registration_profile_name) {
        if (!IsSortingInput(sort.registration_profile_name)) {
          throw new Error('the sorting input must be 1 for ascending or -1 for descending');
        }

        sortStage['registration_profile.name'] = sort.registration_profile_name;
      }

      if (sort.registration_profile_id) {
        if (!IsSortingInput(sort.registration_profile_id)) {
          throw new Error('the sorting input must be 1 for ascending or -1 for descending');
        }

        sortStage.registration_profile_id = sort.registration_profile_id;
      }

      if (sort.financial_support_full_name) {
        if (!IsSortingInput(sort.financial_support_full_name)) {
          throw new Error('the sorting input must be 1 for ascending or -1 for descending');
        }

        sortStage.financial_support_full_name = sort.financial_support_full_name;
      }
    }

    return sortStage;
  } catch (error) {
    throw new Error(`CreateSortPipelineStage error: ${error.message}`);
  }
};

/**
 * @param {Object} filter
 * @param {string} filter.student_full_name
 * @param {string} filter.registration_profile_id
 * @param {string} filter.financial_support_full_name
 * @returns {object}
 */
const CreateMatchPipelineStage = (filter) => {
  const matchStage = {};
  if (filter) {
    if (filter.student_full_name) {
      matchStage.student_full_name = { $regex: filter.student_full_name, $options: 'i' };
    }

    if (filter.registration_profile_id) {
      matchStage.registration_profile_id = ConvertToObjectId(filter.registration_profile_id);
    }

    if (filter.financial_support_full_name) {
      matchStage.financial_support_full_name = { $regex: filter.financial_support_full_name, $options: 'i' };
    }
  }

  return matchStage;
};

/**
 * check if student already have billing or not
 * @param {string} studentId
 * @returns {boolean}
 */
const CheckIfStudentUsedByBilling = async (studentId) => {
  try {
    const billingExist = await Billing.countDocuments({ student_id: ConvertToObjectId(studentId) });

    return billingExist > 0;
  } catch (error) {
    throw new Error(`CheckIfStudentUsedByBilling error: ${error.message}`);
  }
};

module.exports = {
  CreateLookupPipelineStage,
  CreateConcatPipelineStage,
  CreateSortPipelineStage,
  CreateMatchPipelineStage,
  CheckIfStudentUsedByBilling,
};

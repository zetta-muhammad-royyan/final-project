// *************** IMPORT UTILITIES ***************
const { ConvertToObjectId } = require('../../utils/mongoose.utils');

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
  const sortStage = {};
  if (sort) {
    if (sort.registration_profile_name) {
      sortStage['registration_profile.name'] = sort.registration_profile_name;
    }

    if (sort.registration_profile_id) {
      sortStage.registration_profile_id = sort.registration_profile_id;
    }

    if (sort.financial_support_full_name) {
      sortStage.financial_support_full_name = sort.financial_support_full_name;
    }
  }

  return sortStage;
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

module.exports = {
  CreateLookupPipelineStage,
  CreateConcatPipelineStage,
  CreateSortPipelineStage,
  CreateMatchPipelineStage,
};

/**
 * @param {Object} filter
 * @param {string} filter.registration_profile_name
 * @param {string} filter.termination_of_payment_id
 * @returns {Object}
 */
const CreatePipelineMatchStage = (filter) => {
  const matchStage = {};
  if (filter) {
    if (filter.registration_profile_name !== undefined) {
      matchStage.registration_profile_name = { $regex: filter.registration_profile_name, $options: 'i' };
    }
    if (filter.termination_of_payment_id !== undefined) {
      matchStage.termination_of_payment_id = filter.termination_of_payment_id;
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
    if (sort.registration_profile_name !== undefined) {
      sortStage.registration_profile_name = sort.registration_profile_name;
    }
    if (sort.termination_of_payment_id !== undefined) {
      sortStage.termination_of_payment_id = sort.termination_of_payment_id;
    }
  }

  return sortStage;
};

module.exports = {
  CreatePipelineMatchStage,
  CreatePipelineSortStage,
};

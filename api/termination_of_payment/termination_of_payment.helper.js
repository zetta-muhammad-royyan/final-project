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

module.exports = {
  CreatePipelineMatchStage,
  CreateSortPipeline,
};

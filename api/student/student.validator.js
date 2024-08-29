// *************** IMPORT UTILITIES ***************
const { IsString } = require('../../utils/primitiveTypes.utils');

/**
 * Validate Pagination
 * @param {number} page
 * @param {number} limit
 */
const ValidatePagination = (page, limit) => {
  if (page < 1 || limit < 1) {
    throw new Error('Page and limit must be greater than 0');
  }
};

/**
 *
 * @param {string} civility
 * @param {string} firstName
 * @param {string} lastName
 */
const ValidateStudentInput = (civility, firstName, lastName) => {
  if (!IsString(civility) || !IsString(firstName) || !IsString(lastName)) {
    throw new Error('arguments not met the requirements');
  }

  ValidateCivility(civility);
};

/**
 * @param {string} civility
 */
const ValidateCivility = (civility) => {
  if (!['mr', 'mrs', 'neutral'].includes(civility.toLocaleLowerCase())) {
    throw new Error('the civility must be mr, mrs or neutral');
  }
};

module.exports = { ValidateCivility, ValidateStudentInput };

// *************** EXPORT MODULE ***************
module.exports = {
  ValidatePagination,
};

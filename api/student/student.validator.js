// *************** IMPORT UTILITIES ***************
const { IsEmptyString } = require('../../utils/sanity.utils');

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
  if (IsEmptyString(civility)) {
    throw new Error('civility cannot be empty string');
  }

  if (IsEmptyString(firstName)) {
    throw new Error('civility cannot be empty string');
  }

  if (IsEmptyString(lastName)) {
    throw new Error('civility cannot be empty string');
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

// *************** EXPORT MODULE ***************
module.exports = { ValidatePagination, ValidateStudentInput };

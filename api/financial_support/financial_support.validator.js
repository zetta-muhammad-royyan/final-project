// *************** IMPORT UTILITIES ***************
const { IsEmptyString } = require('../../utils/sanity.utils');

/**
 *
 * @param {string} civility
 * @param {string} firstName
 * @param {string} lastName
 */
const ValidateFinancialSupportInput = (civility, firstName, lastName) => {
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

const ValidateCivility = (civility) => {
  if (!['mr', 'mrs', 'neutral'].includes(civility.toLocaleLowerCase())) {
    throw new Error('the civility must be mr, mrs or neutral');
  }
};

module.exports = { ValidateCivility, ValidateFinancialSupportInput };

// *************** IMPORT UTILITIES ***************
const { IsEmptyString } = require('../../utils/sanity.utils');

/**
 *
 * @param {string} civility
 * @param {string} firstName
 * @param {string} lastName
 */
const ValidateFinancialSupportInput = (civility, firstName, lastName) => {
  try {
    if (IsEmptyString(civility)) {
      throw new Error('financial support civility cannot be empty string');
    }

    if (IsEmptyString(firstName)) {
      throw new Error('financial support first name cannot be empty string');
    }

    if (IsEmptyString(lastName)) {
      throw new Error('financial support last name cannot be empty string');
    }

    ValidateCivility(civility);
  } catch (error) {
    throw new Error(`ValidateFinancialSupportInput error: ${error.message}`);
  }
};

const ValidateCivility = (civility) => {
  try {
    if (!['mr', 'mrs', 'neutral'].includes(civility.toLocaleLowerCase())) {
      throw new Error('the civility must be mr, mrs or neutral');
    }
  } catch (error) {
    throw new Error(`ValidateCivility error: ${error.message}`);
  }
};

module.exports = { ValidateCivility, ValidateFinancialSupportInput };

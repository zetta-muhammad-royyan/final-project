// *************** IMPORT UTILITIES ***************
const { IsString } = require('../../utils/primitiveTypes.utils');

/**
 *
 * @param {string} civility
 * @param {string} firstName
 * @param {string} lastName
 */
const ValidateFinancialSupportInput = (civility, firstName, lastName) => {
  if (!IsString(civility) || !IsString(firstName) || !IsString(lastName)) {
    throw new Error('arguments not met the requirements');
  }

  ValidateCivility(civility);
};

const ValidateCivility = (civility) => {
  if (!['mr', 'mrs', 'neutral'].includes(civility.toLocaleLowerCase())) {
    throw new Error('the civility must be mr, mrs or neutral');
  }
};

module.exports = { ValidateCivility, ValidateFinancialSupportInput };

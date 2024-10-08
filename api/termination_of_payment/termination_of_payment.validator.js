// *************** IMPORT LIBRARY ***************
const moment = require('moment');

// *************** IMPORT UTILITIES ***************
const { IsNull, IsEmptyString } = require('../../utils/sanity.utils');

/**
 * @param {Object} input
 * @param {String} input.description - Description of the termination of payments.
 * @param {Array<Object>} input.term_payments - Array of term payments with date and percentage.
 * @param {String} input.term_payments.payment_date - Payment date for a term.
 * @param {Float} input.term_payments.percentage - Percentage of the total fee due on this date.
 * @param {Float} input.additional_cost - Any additional fees applied.
 */
const ValidateTerminationOfPaymentInput = (input) => {
  try {
    const { description, term_payments } = input;
    if (IsNull(description) || IsEmptyString(description)) {
      throw new Error('description cannot be empty string or null');
    }

    ValidateTermPayment(term_payments);
  } catch (error) {
    throw new Error(`ValidateTerminationOfPaymentInput error: ${error.message}`);
  }
};

/**
 * @param {Array<Object>} term_payments - Array of term payments with date and percentage.
 * @param {String} term_payments.payment_date - Payment date for a term.
 * @param {Float} term_payments.percentage - Percentage of the total fee due on this date.
 */
const ValidateTermPayment = (term_payments) => {
  try {
    if (term_payments.length < 1) {
      throw new Error('term_payments cannot be empty');
    }

    for (let i = 0; i < term_payments.length; i++) {
      const currentDate = moment(term_payments[i].payment_date, 'DD-MM-YYYY', true);
      if (i !== 0) {
        //*************** payment date must greater than previous date in an array
        const previousDate = moment(term_payments[i - 1].payment_date, 'DD-MM-YYYY', true);
        if (currentDate.isSameOrBefore(previousDate)) {
          throw new Error('the next payment_date cannot be less than or same with previous payment_date');
        }
      }

      //*************** string date can be converted to date
      if (!currentDate.isValid()) {
        throw new Error('payment_date cannot be converted to date');
      }

      //*************** percentage must be greater than 0
      if (term_payments[i].percentage <= 0) {
        throw new Error('term payment percentage must be greater than zero');
      }
    }

    //*************** total percentage if summed must be 100
    const percentage = term_payments.reduce((acc, cur) => acc + cur.percentage, 0);
    if (percentage !== 100) {
      throw new Error('summed percentage must be 100');
    }
  } catch (error) {
    throw new Error(`ValidateTermPayment error: ${error.message}`);
  }
};

/**
 * Validate Pagination
 * @param {number} page
 * @param {number} limit
 */
const ValidatePagination = (page, limit) => {
  try {
    if (page < 1 || limit < 1) {
      throw new Error('Page and limit must be greater than 0');
    }
  } catch (error) {
    throw new Error(`ValidatePagination error: ${error.message}`);
  }
};

// *************** EXPORT MODULE ***************
module.exports = {
  ValidateTerminationOfPaymentInput,
  ValidateTermPayment,
  ValidatePagination,
};

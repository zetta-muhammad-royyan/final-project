// *************** IMPORT LIBRARY ***************
const moment = require('moment');

// *************** IMPORT UTILITIES ***************
const { IsNumber, IsString } = require('../../utils/primitiveTypes.utils');

/**
 * @param {Object} input
 * @param {String} input.description - Description of the termination of payments.
 * @param {Array<Object>} input.term_payments - Array of term payments with date and percentage.
 * @param {String} input.term_payments.payment_date - Payment date for a term.
 * @param {Float} input.term_payments.percentage - Percentage of the total fee due on this date.
 * @param {Float} input.additional_cost - Any additional fees applied.
 */
const ValidateTerminationOfPaymentInput = (input) => {
  const { description, term_payments, additional_cost } = input;
  if (!IsString(description)) {
    throw new Error('description must be a string');
  }

  if (!IsNumber(additional_cost)) {
    throw new Error('additional_cost must be a number');
  }

  ValidateTermPayment(term_payments);
};

/**
 * @param {Array<Object>} term_payments - Array of term payments with date and percentage.
 * @param {String} term_payments.payment_date - Payment date for a term.
 * @param {Float} term_payments.percentage - Percentage of the total fee due on this date.
 */
const ValidateTermPayment = (term_payments) => {
  if (term_payments.length < 1) {
    throw new Error('term_payments cannot be empty');
  }

  // TODO: handle when only one item in term_Payments
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

    if (!IsNumber(term_payments[i].percentage)) {
      throw new Error('percentage must be a number');
    }
  }

  //*************** total percentage if summed must be 100
  const percentage = term_payments.reduce((acc, cur) => acc + cur.percentage, 0);
  if (percentage !== 100) {
    throw new Error('summed percentage must be 100');
  }
};

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

// *************** EXPORT MODULE ***************
module.exports = {
  ValidateTerminationOfPaymentInput,
  ValidateTermPayment,
  ValidatePagination,
};

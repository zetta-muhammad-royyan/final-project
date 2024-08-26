// *************** Import Library ***************
const moment = require('moment');

// *************** Import Utils ***************
const { isNumber, isString } = require('../../utils/primitiveTypes');

/**
 * @param {Object} input
 * @param {String} input.description - Description of the termination of payments.
 * @param {Array<Object>} input.term_payments - Array of term payments with date and percentage.
 * @param {String} input.term_payments.payment_date - Payment date for a term.
 * @param {Float} input.term_payments.percentage - Percentage of the total fee due on this date.
 * @param {Float} input.additional_cost - Any additional fees applied.
 */
const validateTerminationOfPaymentInput = (input) => {
  const { description, term_payments, additional_cost } = input;
  if (!isString(description)) {
    throw new Error('description must be a string');
  }

  if (!isNumber(additional_cost)) {
    throw new Error('additional_cost must be a number');
  }

  validateTermPayment(term_payments);
};

/**
 * @param {Array<Object>} term_payments - Array of term payments with date and percentage.
 * @param {String} term_payments.payment_date - Payment date for a term.
 * @param {Float} term_payments.percentage - Percentage of the total fee due on this date.
 */
const validateTermPayment = (term_payments) => {
  if (term_payments.length < 1) {
    throw new Error('term_payments cannot be empty');
  }

  // TODO: handle when only one item in term_Payments
  for (let i = 0; i < term_payments.length; i++) {
    const currentDate = moment(term_payments[i].payment_date, 'DD-MM-YYYY', true);
    if (i !== 0) {
      const previousDate = moment(term_payments[i - 1].payment_date, 'DD-MM-YYYY', true);
      if (currentDate.isBefore(previousDate)) {
        throw new Error('the next payment_date cannot be less than previous payment_date');
      }
    }

    if (!currentDate.isValid()) {
      throw new Error('payment_date cannot be converted to date');
    }

    if (!isNumber(term_payments[i].percentage)) {
      throw new Error('percentage must be a number');
    }
  }

  const percentage = term_payments.reduce((acc, cur) => acc + cur.percentage, 0);
  if (percentage !== 100) {
    throw new Error('summed percentage must be 100');
  }
};

module.exports = {
  validateTerminationOfPaymentInput,
  validateTermPayment,
};

/**
 * Validate amount before store to database
 * @param {number} amount
 * @param {boolean} greaterThanZero
 */
const AmountMustHaveMaxTwoDecimal = (amount) => {
  const regex = /^\d+(\.\d{1,2})?$/;
  if (!regex.test(amount.toString())) {
    throw new Error('invalid amount format. maximum two decimal places are allowed.');
  }
};

/**
 * Check if amount greater than zero
 * @param {number} amount
 */
const AmountMustGreaterThanZero = (amount) => {
  if (amount <= 0) {
    throw new Error('amount must be greater than zero');
  }
};

/**
 * Check if amount minus or not
 * @param {number} amount
 */
const AmountCannotBeMinus = (amount) => {
  if (amount < 0) {
    throw new Error('amount cannot be minus');
  }
};

module.exports = { AmountMustHaveMaxTwoDecimal, AmountMustGreaterThanZero, AmountCannotBeMinus };

/**
 * Validate amount before store to database
 * @param {number} amount
 */
const ValidateAmount = (amount) => {
  if (amount <= 0) {
    throw new Error('amount must be greater than zero');
  }

  const regex = /^\d+(\.\d{1,2})?$/;
  if (!regex.test(amount.toString())) {
    throw new Error('invalid amount format. maximum two decimal places are allowed.');
  }
};

module.exports = { ValidateAmount };

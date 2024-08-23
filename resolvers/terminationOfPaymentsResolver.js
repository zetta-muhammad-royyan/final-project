// *************** Import module ***************
const TerminationOfPayments = require('../models/terminationOfPayments');

// *************** Import validator ***************
const { validateTerminationOfPaymentInput } = require('../validators/terminationOfPaymentsValidator');

const terminationOfPaymentsResolver = {
  // *************** Queries ***************
  Query: {},

  // *************** Mutations ***************
  Mutation: {
    /**
     * Create a new TerminationOfPayments document.
     * @param {Object} parent - Parent object, unused in this resolver.
     * @param {Object} args - Arguments for the mutation.
     * @param {String} args.description - Description of the termination of payments.
     * @param {Array<Object>} args.term_payments - Array of term payments with date and percentage.
     * @param {String} args.term_payments.payment_date - Payment date for a term.
     * @param {Float} args.term_payments.percentage - Percentage of the total fee due on this date.
     * @param {Float} args.additional_cost - Any additional fees applied.
     * @returns {Promise<Object>} The created TerminationOfPayments document.
     */
    CreateTerminationOfPayment: async (_parent, args) => {
      try {
        console.log(args);
        validateTerminationOfPaymentInput(args);
        const newTerminationOfPayment = new TerminationOfPayments({
          description: args.description,
          termination: args.term_payments.length,
          term_payments: args.term_payments,
          additional_cost: args.additional_cost,
        });

        return await newTerminationOfPayment.save();
      } catch (error) {
        throw new Error(`Failed to create TerminationOfPayment: ${error.message}`);
      }
    },
  },
};

module.exports = terminationOfPaymentsResolver;

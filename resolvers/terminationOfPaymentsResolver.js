// *************** Import library ***************
const mongoose = require('mongoose');

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

    /**
     * Update existing TerminationOfPayments document.
     * @param {Object} parent - Parent object, unused in this resolver.
     * @param {Object} args - Arguments for the mutation.
     * @param {String} args._id - The id of the document.
     * @param {String} args.description - Description of the termination of payments.
     * @param {Array<Object>} args.term_payments - Array of term payments with date and percentage.
     * @param {String} args.term_payments.payment_date - Payment date for a term.
     * @param {Float} args.term_payments.percentage - Percentage of the total fee due on this date.
     * @param {Float} args.additional_cost - Any additional fees applied.
     * @returns {Promise<Object>} The created TerminationOfPayments document.
     */
    UpdateTerminationOfPayment: async (_parent, args) => {
      try {
        validateTerminationOfPaymentInput(args);
        if (!mongoose.Types.ObjectId.isValid(args._id)) {
          throw new Error('Invalid ID format');
        }

        const updatedTerminationOfPayment = await TerminationOfPayments.findByIdAndUpdate(
          args._id,
          {
            $set: {
              description: args.description,
              termination: args.term_payments.length,
              term_payments: args.term_payments,
              additional_cost: args.additional_cost,
            },
          },
          { new: true }
        );

        if (!updatedTerminationOfPayment) {
          throw new Error('TerminationOfPayments not found');
        }

        return updatedTerminationOfPayment;
      } catch (error) {
        throw new Error(`Failed to update TerminationOfPayment: ${error.message}`);
      }
    },

    /**
     * Delete an existing TerminationOfPayments document.
     * @param {Object} parent - Parent object, unused in this resolver.
     * @param {Object} args - Arguments for the mutation.
     * @param {String} args.id - The ID of the TerminationOfPayments document to delete.
     * @returns {Promise<Boolean>} True if deletion was successful, false otherwise.
     */
    DeleteTerminationOfPayment: async (_parent, args) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(args._id)) {
          throw new Error('Invalid ID format');
        }

        const deletedTerminationOfPayment = await TerminationOfPayments.findByIdAndDelete(args._id);
        if (!deletedTerminationOfPayment) {
          throw new Error('TerminationOfPayments not found');
        }

        return 'TerminationOfPayment deleted successfully';
      } catch (error) {
        throw new Error(`Failed to delete TerminationOfPayment: ${error.message}`);
      }
    },
  },
};

module.exports = terminationOfPaymentsResolver;

// *************** Import library ***************
const mongoose = require('mongoose');

// *************** Import module ***************
const TerminationOfPayments = require('./termination_of_payment.model');

// *************** Import helper ***************
const { validateTerminationOfPaymentInput } = require('./termination_of_payment.helper');

const terminationOfPaymentsResolver = {
  // *************** Queries ***************
  Query: {
    /**
     * Retrieve all TerminationOfPayments documents with optional filtering, sorting, and pagination.
     * @param {Object} parent - Parent object, unused in this resolver.
     * @param {Object} args - Arguments for the query.
     * @param {Object} [args.filter] - Optional filters for the query.
     * @param {String} [args.filter.description] - Filter by description.
     * @param {Int} [args.filter.termination] - Filter by number of terms.
     * @param {Object} [args.sort] - Optional sorting for the query.
     * @param {Int} [args.sort.description] - Sort by description. 1 for ascending, -1 for descending.
     * @param {Int} [args.sort.termination] - Sort by termination. 1 for ascending, -1 for descending.
     * @param {Object} args.pagination - Pagination information.
     * @param {Int} args.pagination.page - Page number.
     * @param {Int} args.pagination.limit - Number of items per page.
     * @returns {Promise<Object>} Paginated result with items and total count.
     */
    GetAllTerminationOfPayments: async (_parent, { filter, sort, pagination }) => {
      try {
        const { page = 1, limit = 10 } = pagination;

        if (page < 1 || limit < 1) {
          throw new Error('Page and limit must be greater than 0');
        }

        const pipeline = [];

        const matchStage = {};
        if (filter) {
          if (filter.description) {
            matchStage.description = { $regex: filter.description, $options: 'i' };
          }
          if (filter.termination !== undefined) {
            matchStage.termination = filter.termination;
          }

          pipeline.push({ $match: matchStage });
        }

        const sortStage = {};
        if (sort) {
          if (sort.description !== undefined) {
            sortStage.description = sort.description;
          }
          if (sort.termination !== undefined) {
            sortStage.termination = sort.termination;
          }

          pipeline.push({ $sort: sortStage });
        }

        pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

        return await TerminationOfPayments.aggregate(pipeline);
      } catch (error) {
        throw new Error(`Failed to fetch TerminationOfPayments: ${error.message}`);
      }
    },

    /**
     * Retrieve a TerminationOfPayments document by ID.
     * @param {Object} parent - Parent object, unused in this resolver.
     * @param {Object} args - Arguments for the query.
     * @param {String} args._id - The ID of the TerminationOfPayments document to retrieve.
     * @returns {Promise<TerminationOfPayments | null>} The TerminationOfPayments document or null if not found.
     */
    GetOneTerminationOfPayment: async (_parent, { _id }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(_id)) {
          throw new Error('Invalid ID format');
        }

        const terminationOfPayments = await TerminationOfPayments.findById(_id);
        if (!terminationOfPayments) {
          throw new Error('TerminationOfPayments not found');
        }

        return terminationOfPayments;
      } catch (error) {
        throw new Error(`Failed to fetch TerminationOfPayments by ID: ${error.message}`);
      }
    },
  },

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

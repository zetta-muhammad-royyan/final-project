// *************** IMPORT MODULE ***************
const TerminationOfPayment = require('./termination_of_payment.model');

// *************** IMPORT UTILITIES ***************
const { CheckObjectId } = require('../../utils/mongoose.utils');

// *************** IMPORT HELPER FUNCTION ***************
const { CreatePipelineMatchStage, CreateSortPipeline } = require('./termination_of_payment.helper');

// *************** IMPORT VALIDATOR ***************
const { ValidateTerminationOfPaymentInput, ValidatePagination } = require('./termination_of_payment.validator');

// *************** QUERY ***************

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
const GetAllTerminationOfPayments = async (_parent, { filter, sort, pagination }) => {
  try {
    //*************** page and limit must be greater than 0
    const { page = 1, limit = 10 } = pagination;
    ValidatePagination(page, limit);

    //*************** base pipeline
    const pipeline = [];

    //*************** $match stage, only active when filter contain data
    const matchStage = CreatePipelineMatchStage(filter);
    if (Object.keys(matchStage).length > 0) {
      pipeline.push(matchStage);
    }

    //*************** $sort stage, only active when filter contain data
    const sortStage = CreateSortPipeline(sort);
    if (Object.keys(sortStage).length > 0) {
      pipeline.push(sortStage);
    }

    //*************** pagination pipeline with $skip and $limit
    pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

    return await TerminationOfPayment.aggregate(pipeline);
  } catch (error) {
    throw new Error(`Failed to fetch TerminationOfPayments: ${error.message}`);
  }
};

/**
 * Retrieve a TerminationOfPayments document by ID.
 * @param {Object} parent - Parent object, unused in this resolver.
 * @param {Object} args - Arguments for the query.
 * @param {String} args._id - The ID of the TerminationOfPayments document to retrieve.
 * @returns {Promise<TerminationOfPayments | null>} The TerminationOfPayments document or null if not found.
 */
const GetOneTerminationOfPayment = async (_parent, { _id }) => {
  try {
    CheckObjectId(_id);

    const terminationOfPayments = await TerminationOfPayment.findById(_id);
    if (!terminationOfPayments) {
      throw new Error('TerminationOfPayments not found');
    }

    return terminationOfPayments;
  } catch (error) {
    throw new Error(`Failed to fetch TerminationOfPayments by ID: ${error.message}`);
  }
};

// *************** MUTATION ***************

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
const CreateTerminationOfPayment = async (_parent, args) => {
  try {
    ValidateTerminationOfPaymentInput(args);
    const newTerminationOfPayment = new TerminationOfPayment({
      description: args.description,
      termination: args.term_payments.length,
      term_payments: args.term_payments,
      additional_cost: args.additional_cost,
    });

    return await newTerminationOfPayment.save();
  } catch (error) {
    throw new Error(`Failed to create TerminationOfPayment: ${error.message}`);
  }
};

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
const UpdateTerminationOfPayment = async (_parent, args) => {
  try {
    ValidateTerminationOfPaymentInput(args);
    CheckObjectId(args._id);

    const updatedTerminationOfPayment = await TerminationOfPayment.findByIdAndUpdate(
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
};

/**
 * Delete an existing TerminationOfPayments document.
 * @param {Object} parent - Parent object, unused in this resolver.
 * @param {Object} args - Arguments for the mutation.
 * @param {String} args._id - The ID of the TerminationOfPayments document to delete.
 * @returns {Promise<Boolean>} True if deletion was successful, false otherwise.
 */
const DeleteTerminationOfPayment = async (_parent, args) => {
  try {
    CheckObjectId(args._id);

    const deletedTerminationOfPayment = await TerminationOfPayment.findByIdAndDelete(args._id);
    if (!deletedTerminationOfPayment) {
      throw new Error('TerminationOfPayments not found');
    }

    return 'TerminationOfPayment deleted successfully';
  } catch (error) {
    throw new Error(`Failed to delete TerminationOfPayment: ${error.message}`);
  }
};

const terminationOfPaymentResolver = {
  Query: {
    GetAllTerminationOfPayments,
    GetOneTerminationOfPayment,
  },

  Mutation: {
    CreateTerminationOfPayment,
    UpdateTerminationOfPayment,
    DeleteTerminationOfPayment,
  },
};

// *************** EXPORT MODULE ***************
module.exports = terminationOfPaymentResolver;

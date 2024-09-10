// *************** IMPORT MODULE ***************
const TerminationOfPayment = require('./termination_of_payment.model');

// *************** IMPORT UTILITIES ***************
const { CheckObjectId, ConvertToObjectId } = require('../../utils/mongoose.utils');
const { AmountCannotBeMinus, AmountMustHaveMaxTwoDecimal } = require('../../utils/monetary.utils');
const { TrimString } = require('../../utils/string.utils');
const { IsEmptyString, IsUndefinedOrNull } = require('../../utils/sanity.utils');

// *************** IMPORT HELPER FUNCTION ***************
const {
  CreatePipelineMatchStage,
  CreateSortPipeline,
  CheckIfTerminationOfPaymentUsedByRegistrationProfile,
  CheckIfTerminationOfPaymentUsedByBilling,
} = require('./termination_of_payment.helper');

// *************** IMPORT VALIDATOR ***************
const { ValidateTerminationOfPaymentInput, ValidatePagination, ValidateTermPayment } = require('./termination_of_payment.validator');

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
      pipeline.push({ $match: matchStage });
    }

    //*************** $sort stage, only active when filter contain data
    const sortStage = CreateSortPipeline(sort);
    if (Object.keys(sortStage).length > 0) {
      pipeline.push({ $sort: sortStage });
    }

    //*************** pagination pipeline with $skip and $limit
    pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

    //*************** fetch termination of payment uses previously built pipeline
    const terminationOfPayments = await TerminationOfPayment.aggregate(pipeline);
    return terminationOfPayments;
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

    //*************** fetcg termintation of payment using id which is sent via parameter
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

    //*************** only two decimal allowed
    AmountMustHaveMaxTwoDecimal(args.additional_cost);

    //*************** amount cannot be minus
    AmountCannotBeMinus(args.additional_cost);

    //*************** create new termination of payment
    const newTerminationOfPayment = new TerminationOfPayment({
      description: TrimString(args.description),
      termination: args.term_payments.length,
      term_payments: args.term_payments,
      additional_cost: args.additional_cost,
    });

    const createdTerminationOfPayment = await newTerminationOfPayment.save();

    return createdTerminationOfPayment;
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
    CheckObjectId(args._id);

    if (IsEmptyString(args.description)) {
      throw new Error('description cannot be empty string');
    }

    //*************** validate additional cost if exists
    if (!IsUndefinedOrNull(args.additional_cost)) {
      //*************** only two decimal allowed
      AmountMustHaveMaxTwoDecimal(args.additional_cost);

      //*************** amount cannot be minus
      AmountCannotBeMinus(args.additional_cost);
    }

    //*************** validate term payments if exists
    if (args.term_payments || (Array.isArray(args.term_payments) && args.term_payments.length > 0)) {
      ValidateTermPayment(args.term_payments);
    }

    //*************** fetch termination of payment first to update it later
    const termination = await TerminationOfPayment.findById(args._id);
    if (!termination) {
      throw new Error('TerminationOfPayment not found');
    }

    //*************** check if termination of payment already used by billing or not
    const usedByBilling = await CheckIfTerminationOfPaymentUsedByBilling(args._id);
    if (usedByBilling) {
      //*************** cannot update additional_cost and term_payments if already used by billing
      if (
        !IsUndefinedOrNull(args.additional_cost) ||
        !IsUndefinedOrNull(args.term_payments) ||
        (Array.isArray(args.term_payments) && args.term_payments.length > 0)
      ) {
        throw new Error('cannot update additional cost or term payments if billing already generated using this termination of payment');
      }

      //*************** can only update description if termination of payment already used by billing
      termination.description = args.description ? TrimString(args.description) : termination.description;
      const updatedTerminationOfPayment = await termination.save();
      return updatedTerminationOfPayment;
    }

    //*************** update termination of payment data with new one if sent via parameter, if not then use previous data
    termination.description = args.description ? TrimString(args.description) : termination.description;
    termination.termination = args.term_payments ? args.term_payments.length : termination.termination;
    termination.term_payments = args.term_payments ? args.term_payments : termination.term_payments;
    termination.additional_cost = args.additional_cost ? args.additional_cost : termination.additional_cost;
    const updatedTerminationOfPayment = await termination.save();

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

    //*************** cannot delete termination of payment if already used by registration profile
    const usedByRegistrationProfile = await CheckIfTerminationOfPaymentUsedByRegistrationProfile(args._id);
    if (usedByRegistrationProfile) {
      throw new Error('cannot delete termination of payment because already used by registration profile');
    }

    //*************** cannot delete terminnation of payment because generated billing use this termination of payment
    const usedByBilling = await CheckIfTerminationOfPaymentUsedByBilling(args._id);
    if (usedByBilling) {
      throw new Error('cannot delete termination of payment because already used by billing');
    }

    //*************** delete termination of payment by id
    const deletedTerminationOfPayment = await TerminationOfPayment.deleteOne({ _id: ConvertToObjectId(args._id) });
    if (deletedTerminationOfPayment.deletedCount !== 1) {
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

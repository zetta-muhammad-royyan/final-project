// *************** IMPORT UTILITIES ***************
const { CheckObjectId } = require('../../utils/mongoose.utils');
const { AmountMustHaveMaxTwoDecimal, AmountMustGreaterThanZero } = require('../../utils/monetary.utils');

// *************** IMPORT HELPER FUNCTION ***************
const {
  CheckIfStudentHasBillingOrNot,
  GenerateBillingBasedOnPayer,
  FindBillingWithLookup,
  PayDeposit,
  PayTerms,
} = require('./billing.helper');

// *************** IMPORT VALIDATOR ***************
const { ValidatePayer } = require('./billing.validator');

// *************** MUTATION ***************

/**
 * Generate billing
 * @param {Object} _parent
 * @param {Object} args
 * @param {String} args.student_id
 * @param {String} args.payment_type
 * @param {Array<Object>} args.payer
 * @param {String} args.payer.payer_id
 * @param {Number} args.payer.cost_coverage
 * @param {Object} context
 * @param {Object} context.models
 * @returns {Promise<Array<Object>>}
 */
const GenerateBilling = async (_parent, args, { models }) => {
  // *************** Student who has billing cannot generate billing again
  await CheckIfStudentHasBillingOrNot(args.student_id);

  // *************** Check student_id valid or not
  CheckObjectId(args.student_id);

  // *************** Fetch required data
  const student = await models.student.findOne({ _id: args.student_id });
  if (!student) {
    throw new Error('Student not found');
  }

  const registrationProfile = await models.registrationProfile.findOne({ _id: student.registration_profile_id });
  if (!registrationProfile) {
    throw new Error('Registration Profile not found');
  }

  const terminationOfPayment = await models.terminationOfPayment.findOne({ _id: registrationProfile.termination_of_payment_id });
  if (!terminationOfPayment) {
    throw new Error('Termination of Payment not found');
  }

  // *************** Calculate totalAmount and termAmount
  const totalAmount = registrationProfile.scholarship_fee + registrationProfile.registration_fee + terminationOfPayment.additional_cost;
  const termAmount = totalAmount - registrationProfile.deposit;

  // *************** validate payer
  const validatedPayer = await ValidatePayer(args.payer, args.payment_type);

  //*************** generate billing according to the number of payers
  const billings = await GenerateBillingBasedOnPayer(
    args.student_id,
    registrationProfile._id,
    validatedPayer,
    terminationOfPayment.term_payments,
    totalAmount,
    termAmount,
    registrationProfile.deposit
  );

  return billings;
};

/**
 * @param {Object} _parent
 * @param {Object} args
 * @param {string} args.billing_id
 * @param {number} args.amount
 * @param {Object} context
 * @param {Object} context.models
 */
const AddPayment = async (_parent, args, { models }) => {
  try {
    CheckObjectId(args.billing_id);

    //*************** only two decimal allowed
    AmountMustHaveMaxTwoDecimal(args.amount);

    //*************** amount must be greater than zero
    AmountMustGreaterThanZero(args.amount);

    const billing = await FindBillingWithLookup({ billingId: args.billing_id }, ['term', 'deposit']);
    if (!billing) {
      throw new Error('Billing not found');
    }

    //*************** amount cannot be greater than remaining amount
    if (args.amount > billing.remaining_due) {
      throw new Error('the amount to be paid is more than it should be');
    }

    //*************** billing hold deposit amount
    if (billing.deposit_id) {
      //*************** pay deposit first
      const remainder = await PayDeposit(billing.deposit[0], args.amount);

      //*************** if remainder amount more than 0 then pay the terms
      await PayTerms(billing.terms, remainder);
    } else {
      //*************** if billing doesnt hold deposit amount then fetch another student billing
      const billings = await FindBillingWithLookup({ studentId: billing.student_id }, ['term', 'deposit']);
      const depositBilling = billings.find((billing) => billing.deposit_id);
      if (!depositBilling) {
        throw new Error('this student doesnt have deposit billing');
      }

      //*************** deposit must be paid first before pay term
      if (depositBilling.deposit.reduce((acc, curr) => acc + curr.remaining_amount, 0) > 0) {
        throw new Error('must pay the deposit first');
      }

      //*************** deposit on another billing already paid then pay the terms
      await PayTerms(billing.terms, args.amount);
    }

    const paidAmount =
      args.amount > billing.remaining_due
        ? parseFloat(args.amount).toFixed(2)
        : (parseFloat(billing.paid_amount) + parseFloat(args.amount)).toFixed(2);

    const remainingDue =
      args.amount - billing.remaining_due < 0
        ? Math.abs(parseFloat(args.amount) - parseFloat(billing.remaining_due)).toFixed(2)
        : parseFloat(0).toFixed(2);

    const updatedBilling = await models.billing.findByIdAndUpdate(
      billing._id,
      {
        paid_amount: paidAmount,
        remaining_due: remainingDue,
      },
      { new: true }
    );

    return updatedBilling;
  } catch (error) {
    throw new Error(`Failed to add payment: ${error.message}`);
  }
};

// *************** LOADER ***************

/**.
 * @function student
 * @param {Object} parent
 * @param {Object} _args
 * @param {Object} context
 * @param {Object} context.loaders
 * @returns {Promise<Object>}
 */
const GetStudent = async (parent, _args, { loaders }) => {
  return loaders.studentLoader.load(parent.student_id);
};

/**.
 * @function registration_profile
 * @param {Object} parent
 * @param {Object} _args
 * @param {Object} context
 * @param {Object} context.loaders
 * @returns {Promise<Object>}
 */
const GetRegistrationProfile = async (parent, _args, { loaders }) => {
  return loaders.registrationProfileLoader.load(parent.registration_profile_id);
};

/**.
 * @function terms
 * @param {Object} parent
 * @param {Object} _args
 * @param {Object} context
 * @param {Object} context.loaders
 * @returns {Promise<Object>}
 */
const GetTerms = async (parent, _args, { loaders }) => {
  if (!parent.term_ids || parent.term_ids.length < 1) {
    return [];
  }

  return loaders.termLoader.loadMany(parent.term_ids);
};

/**.
 * @function deposit
 * @param {Object} parent
 * @param {Object} _args
 * @param {Object} context
 * @param {Object} context.loaders
 * @returns {Promise<Object>}
 */
const GetDeposit = async (parent, _args, { loaders }) => {
  if (!parent.deposit_id) {
    return null;
  }

  return loaders.depositLoader.load(parent.deposit_id);
};

/**.
 * @function deposit
 * @param {Object} parent
 * @param {Object} _args
 * @param {Object} context
 * @param {Object} context.loaders
 * @returns {Promise<Object>}
 */
const GetPayer = async (parent, _args, { loaders }) => {
  if (!parent.payer) {
    return null;
  }

  const [student, financialSupport] = await Promise.all([
    loaders.studentLoader.load(parent.payer),
    loaders.financialSupportLoader.load(parent.payer),
  ]);

  if (student) {
    return student;
  } else if (financialSupport) {
    return financialSupport;
  }
};

const billingResolver = {
  Query: {},

  Mutation: {
    GenerateBilling,
    AddPayment,
  },

  Billing: {
    student: GetStudent,
    registration_profile: GetRegistrationProfile,
    terms: GetTerms,
    deposit: GetDeposit,
    payer: GetPayer,
  },
};

// *************** EXPORT MODULE ***************
module.exports = billingResolver;

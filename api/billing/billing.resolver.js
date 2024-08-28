// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

// *************** IMPORT HELPER FUNCTION ***************
const { CheckIfStudentHasBillingOrNot, ValidatePayer, GenerateBillingBasedOnPayer } = require('./billing.helper');

const billingResolver = {
  // *************** QUERY ***************
  Query: {},

  // *************** MUTATION ***************
  Mutation: {
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
    GenerateBilling: async (_parent, args, { models }) => {
      // *************** Student who has billing cannot generate billing again ***************
      await CheckIfStudentHasBillingOrNot(args.student_id);

      // *************** Check student_id valid or not ***************
      if (!mongoose.Types.ObjectId.isValid(args.student_id)) {
        throw new Error('Invalid student_id format');
      }

      // *************** Fetch required data ***************
      const student = await models.student.findOne({ _id: args.student_id });
      const registrationProfile = await models.registrationProfile.findOne({ _id: student.registration_profile_id });
      const terminationOfPayment = await models.terminationOfPayment.findOne({ _id: registrationProfile.termination_of_payment_id });

      // *************** Calculate totalAmount and termAmount ***************
      const totalAmount = registrationProfile.scholarship_fee + registrationProfile.registration_fee + terminationOfPayment.additional_cost;
      const termAmount = totalAmount - registrationProfile.deposit;

      // *************** validate payer ***************
      const validatedPayer = await ValidatePayer(args.payer);
      return await GenerateBillingBasedOnPayer(
        args.student_id,
        registrationProfile._id,
        validatedPayer,
        terminationOfPayment.term_payments,
        totalAmount,
        termAmount,
        registrationProfile.deposit
      );
    },
  },

  // *************** LOADER ***************
  Billing: {
    /**.
     * @function student
     * @param {Object} parent
     * @param {Object} _args
     * @param {Object} context
     * @param {Object} context.loaders
     * @returns {Promise<Object>}
     */
    student: async (parent, _args, { loaders }) => {
      return loaders.studentLoader.load(parent.student_id);
    },

    /**.
     * @function registration_profile
     * @param {Object} parent
     * @param {Object} _args
     * @param {Object} context
     * @param {Object} context.loaders
     * @returns {Promise<Object>}
     */
    registration_profile: async (parent, _args, { loaders }) => {
      return loaders.registrationProfileLoader.load(parent.registration_profile_id);
    },

    /**.
     * @function terms
     * @param {Object} parent
     * @param {Object} _args
     * @param {Object} context
     * @param {Object} context.loaders
     * @returns {Promise<Object>}
     */
    terms: async (parent, _args, { loaders }) => {
      return loaders.termLoader.loadMany(parent.term_ids);
    },

    /**.
     * @function deposit
     * @param {Object} parent
     * @param {Object} _args
     * @param {Object} context
     * @param {Object} context.loaders
     * @returns {Promise<Object>}
     */
    deposit: async (parent, _args, { loaders }) => {
      return loaders.depositLoader.load(parent.deposit_id);
    },
  },
};

// *************** EXPORT MODULE ***************
module.exports = billingResolver;

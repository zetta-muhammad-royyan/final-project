// *************** Import library ***************
// const mongoose = require('mongoose');

// *************** Import helper ***************
const { addOrReplaceFinancialSupport } = require('../financial_support/financial_support.helper');

// *************** Import utils ***************
const { isString } = require('../../utils/primitiveTypes');

const studentResolver = {
  Query: {},
  Mutation: {
    /**
     * Create new Student
     * @param {Object} _parent
     * @param {Object} args
     * @param {String} args.civility
     * @param {String} args.first_name
     * @param {String} args.last_name
     * @param {String} args.registration_profile_id
     * @param {Array<Object>} args.financial_support
     * @param {String} args.financial_support.civility
     * @param {String} args.financial_support.first_name
     * @param {String} args.financial_support.last_name
     * @param {Object} context
     * @param {Object} context.models
     * @returns {Promise<Object>}
     */
    CreateStudent: async (_parent, args, { models }) => {
      try {
        if (!isString(args.civility) && !isString(args.first_name) && !isString(args.last_name)) {
          throw new Error('arguments not met the requirements');
        }

        if (!['mr', 'mrs', 'neutral'].includes(args.civility.toLocaleLowerCase())) {
          throw new Error('the civility must be mr, mrs or neutral');
        }

        const newStudent = new models.student({
          civility: args.civility,
          first_name: args.first_name,
          last_name: args.last_name,
          registration_profile_id: args.registration_profile_id,
        });

        let createdStudent = await newStudent.save();

        // create financial support
        const financialSupportIds = await addOrReplaceFinancialSupport(createdStudent, args.financial_support);
        createdStudent.financial_support_ids = financialSupportIds;

        return await createdStudent.save();
      } catch (error) {
        throw new Error(`Failed to create Student: ${error.message}`);
      }
    },
  },
};

module.exports = studentResolver;

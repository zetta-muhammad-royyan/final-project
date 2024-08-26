// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

// *************** IMPORT HELPER FUNCTION ***************
const { AddOrReplaceFinancialSupport } = require('../financial_support/financial_support.helper');

// *************** IMPORT UTILITIES ***************
const { IsString } = require('../../utils/primitiveTypes');

const studentResolver = {
  // *************** Query ***************
  Query: {},

  // *************** Mutation ***************
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
        if (!IsString(args.civility) && !IsString(args.first_name) && !IsString(args.last_name)) {
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

        // *************** Create Financial Support ***************
        const financialSupportIds = await AddOrReplaceFinancialSupport(createdStudent, args.financial_support);

        // *************** Update student financial_support_ids with new one ***************
        createdStudent.financial_support_ids = financialSupportIds;

        return await createdStudent.save();
      } catch (error) {
        throw new Error(`Failed to create Student: ${error.message}`);
      }
    },

    /**
     * Update Existing Student
     * @param {Object} _parent
     * @param {Object} args
     * @param {String} args._id
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
    UpdateStudent: async (_parent, args, { models }) => {
      try {
        if (!IsString(args.civility) && !IsString(args.first_name) && !IsString(args.last_name)) {
          throw new Error('arguments not met the requirements');
        }

        if (!['mr', 'mrs', 'neutral'].includes(args.civility.toLocaleLowerCase())) {
          throw new Error('the civility must be mr, mrs or neutral');
        }

        if (!mongoose.Types.ObjectId.isValid(args._id)) {
          throw new Error('Invalid ID format');
        }

        const student = await models.student.findById(args._id);
        const financialSupportIds = await AddOrReplaceFinancialSupport(student, args.financial_support || []);

        // *************** Update student with new data ***************
        student.civility = args.civility;
        student.first_name = args.first_name;
        student.last_name = args.last_name;
        student.financial_support_ids = financialSupportIds;
        student.registration_profile_id = args.registration_profile_id;

        return await student.save();
      } catch (error) {
        throw new Error(`Failed to update Student: ${error.message}`);
      }
    },

    /**
     * Delete student
     * @param {Object} _parent
     * @param {Object} args
     * @param {String} args._id
     * @param {Object} context
     * @param {Object} contex.models
     * @returns {Promise<String>}
     */
    DeleteStudent: async (_parent, args, { models }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(args._id)) {
          throw new Error('Invalid ID format');
        }

        const deletedStudent = await models.student.findByIdAndDelete(args._id);
        console.log(deletedStudent);
        if (!deletedStudent) {
          throw new Error('Student not found');
        }

        // *************** Delete student financial supports if any ***************
        if (deletedStudent.financial_support_ids.length > 0) {
          await models.financialSupport.deleteMany({ _id: { $in: deletedStudent.financial_support_ids } });
        }

        return 'Student deleted successfully';
      } catch (error) {
        throw new Error(`Failed to delete Student: ${error.message}`);
      }
    },
  },
};

// *************** EXPORT MODULE ***************
module.exports = studentResolver;

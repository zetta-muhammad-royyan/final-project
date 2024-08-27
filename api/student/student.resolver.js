// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

// *************** IMPORT HELPER FUNCTION ***************
const { AddOrReplaceFinancialSupport } = require('../financial_support/financial_support.helper');

// *************** IMPORT UTILITIES ***************
const { IsString } = require('../../utils/primitiveTypes');

const studentResolver = {
  // *************** Query ***************
  Query: {
    /**
     * Retrieve all RegistrationProfiles with optional filter and sorting
     * @param {Object} _parent
     * @param {Object} args
     * @param {Object} args.filter
     * @param {String} args.filter.student_full_name
     * @param {String} args.filter.registration_profile_id
     * @param {String} args.filter.financial_support_full_name
     * @param {Object} args.sort
     * @param {String} args.sort.registration_profile_name
     * @param {String} args.sort.registration_profile_id
     * @param {String} args.sort.financial_support_full_name
     * @param {Object} args.pagination
     * @param {Int} args.pagination.page
     * @param {Int} args.pagination.limit
     * @param {Object} context
     * @param {Object} context.models
     * @returns {Promise<Object>}
     */
    GetAllStudents: async (_parent, { filter, sort, pagination }, { models }) => {
      try {
        const { page = 1, limit = 10 } = pagination;
        if (page < 1 || limit < 1) {
          throw new Error('Page and limit must be greater than 0');
        }

        const pipeline = [];

        // *************** check if need to lookup to financial support or not ***************
        let needsToRegistrationProfileLookup = sort && sort.registration_profile_name;

        // *************** check if need to lookup to financial support or not ***************
        let needsFinancialSupportLookup = filter && filter.financial_support_full_name ? true : false;
        if (sort && sort.financial_support_full_name) {
          needsFinancialSupportLookup = true;
        }

        // *************** if the sort based on registration_profile_name, need lookup first  ***************
        if (needsToRegistrationProfileLookup) {
          pipeline.push({
            $lookup: {
              from: 'registration_profiles',
              localField: 'registration_profile_id',
              foreignField: '_id',
              as: 'registration_profile',
            },
          });

          pipeline.push({
            $unwind: {
              path: '$registration_profile',
              preserveNullAndEmptyArrays: true,
            },
          });
        }

        // *************** if the filter based on financial_support_full_name, need lookup first  ***************
        if (needsFinancialSupportLookup) {
          pipeline.push({
            $lookup: {
              from: 'financial_supports',
              localField: 'financial_support_ids',
              foreignField: '_id',
              as: 'financial_supports',
            },
          });

          pipeline.push({
            $unwind: {
              path: '$financial_supports',
              preserveNullAndEmptyArrays: true,
            },
          });
        }

        // *************** add field if need concatenated name ***************
        const addFieldStage = {
          $addFields: {},
        };

        // *************** check if the filter is on or not ***************
        if (sort || filter) {
          if ((filter && filter.student_full_name) || needsFinancialSupportLookup || (sort && sort.financial_support_full_name)) {
            if (filter && filter.student_full_name !== undefined) {
              addFieldStage.$addFields.student_full_name = {
                $concat: ['$first_name', ' ', '$last_name'],
              };
            }

            if (needsFinancialSupportLookup) {
              addFieldStage.$addFields.financial_support_full_name = {
                $concat: ['$financial_supports.first_name', ' ', '$financial_supports.last_name'],
              };
            }
          }
        }

        if (Object.keys(addFieldStage.$addFields).length > 0) {
          pipeline.push(addFieldStage);
        }

        // *************** sort stage ***************
        const sortStage = {};
        if (sort) {
          if (sort.registration_profile_name) {
            sortStage['registration_profile.name'] = sort.registration_profile_name;
          }

          if (sort.registration_profile_id) {
            sortStage.registration_profile_id = sort.registration_profile_id;
          }

          if (sort.financial_support_full_name) {
            sortStage.financial_support_full_name = sort.financial_support_full_name;
          }
        }

        if (Object.keys(sortStage).length > 0) {
          pipeline.push({ $sort: sortStage });
        }

        // *************** match stage ***************
        const matchStage = {};
        if (filter) {
          if (filter.student_full_name) {
            matchStage.student_full_name = { $regex: filter.student_full_name, $options: 'i' };
          }

          if (filter.registration_profile_id) {
            matchStage.registration_profile_id = mongoose.Types.ObjectId(filter.registration_profile_id);
          }

          if (filter.financial_support_full_name) {
            matchStage.financial_support_full_name = { $regex: filter.financial_support_full_name, $options: 'i' };
          }
        }

        if (Object.keys(matchStage).length > 0) {
          pipeline.push({ $match: matchStage });
        }

        // *************** pagination stage ***************
        pipeline.push({ $skip: (page - 1) * limit });
        pipeline.push({ $limit: limit });

        // *************** project stage ***************
        pipeline.push({
          $project: {
            _id: 1,
            civility: 1,
            first_name: 1,
            last_name: 1,
            financial_support_ids: 1,
            registration_profile_id: 1,
            financial_supports: 1,
            financial_support_full_name: 1,
            student_full_name: 1,
          },
        });

        const students = await models.student.aggregate(pipeline);
        return students;
      } catch (error) {
        throw new Error(`Failed to fetch all Student: ${error.message}`);
      }
    },

    /**
     * Get one student document by id
     * @param {Object} _parent
     * @param {Object} args
     * @param {string} args._id
     * @param {Object} context
     * @param {Object} context.models
     */
    GetOneStudent: async (_parent, args, { models }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(args._id)) {
          throw new Error('Invalid ID format');
        }

        const student = await models.student.findById(args._id);
        if (!student) {
          throw new Error('Student not found');
        }

        return student;
      } catch (error) {
        throw new Error(`Failed to fetch Student by Id: ${error.message}`);
      }
    },
  },

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

  // *************** LOADER ***************
  Student: {
    /**
     * Fetches the financial support details for the given parent object's `financial_support_ids`.
     * @function financial_supports
     * @param {Object} parent - The parent object containing the `financial_support_ids`.
     * @param {Object} _args - Arguments provided by GraphQL resolver, not used in this function.
     * @param {Object} context - The context object, which contains various loaders.
     * @param {Object} context.loaders - The loaders object containing DataLoader instances.
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of financial support details loaded by DataLoader.
     */
    financial_supports: (parent, _args, { loaders }) => {
      return loaders.financialSupportLoader.loadMany(parent.financial_support_ids);
    },

    /**
     * Fetches the registration profile details for the given parent object's `registration_profile_id`.
     * @function registration_profile
     * @param {Object} parent - The parent object containing the `registration_profile_id`.
     * @param {Object} _args - Arguments provided by GraphQL resolver, not used in this function.
     * @param {Object} context - The context object, which contains various loaders.
     * @param {Object} context.loaders - The loaders object containing DataLoader instances.
     * @returns {Promise<Object>} A promise that resolves to the registration profile details loaded by DataLoader.
     */
    registration_profile: (parent, _args, { loaders }) => {
      return loaders.registrationProfileLoader.load(parent.registration_profile_id);
    },
  },
};

// *************** EXPORT MODULE ***************
module.exports = studentResolver;

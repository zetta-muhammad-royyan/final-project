// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const student = gql`
  # schemas
  type Student {
    _id: ID!
    civility: String!
    first_name: String!
    last_name: String!
    financial_support_ids: [ID]!
    registration_profile_id: ID!
  }

  type FinancialSupport {
    _id: ID!
    civility: String!
    first_name: String!
    last_name: String!
    student_id: ID!
  }

  # input
  input FinancialSupportInput {
    civility: String!
    first_name: String!
    last_name: String!
  }

  input StudentFilterInput {
    student_full_name: String
    registration_profile_id: ID
    financial_support_full_name: String
  }

  input StudentSortInput {
    registration_profile_name: Int
    registration_profile_id: Int
    financial_support_full_name: Int
  }

  input StudentPaginationInput {
    page: Int!
    limit: Int!
  }

  # queries
  type Query {
    GetAllStudents(filter: StudentFilterInput, sort: StudentSortInput, pagination: StudentPaginationInput): [Student]!
    GetOneStudent(_id: ID!): Student
  }

  # mutations
  type Mutation {
    CreateStudent(
      civility: String!
      first_name: String!
      last_name: String
      financial_support: [FinancialSupportInput]!
      registration_profile_id: ID!
    ): Student!
    UpdateStudent(
      _id: ID!
      civility: String!
      first_name: String!
      last_name: String
      financial_support: [FinancialSupportInput]
      registration_profile_id: ID!
    ): Student!
    DeleteStudent(_id: ID!): String!
  }
`;

// *************** EXPORT MODULE ***************
module.exports = student;

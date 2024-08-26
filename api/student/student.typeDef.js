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

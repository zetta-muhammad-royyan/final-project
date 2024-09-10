// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const registrationProfiles = gql`
  # Schemas
  type RegistrationProfile {
    _id: ID!
    registration_profile_name: String!
    scholarship_fee: Float!
    deposit: Float!
    registration_fee: Float!
    termination_of_payment: TerminationOfPayment
    status: String
  }

  # Inputs
  input RegistrationProfileFilterInput {
    registration_profile_name: String
    termination_of_payment_id: String
  }

  input RegistrationProfileSortingInput {
    registration_profile_name: Int
    termination_of_payment_id: Int
  }

  input RegistrationProfilePaginationInput {
    page: Int!
    limit: Int!
  }

  # Queries
  type Query {
    GetAllRegistrationProfiles(
      pagination: RegistrationProfilePaginationInput!
      filter: RegistrationProfileFilterInput
      sort: RegistrationProfileSortingInput
    ): [RegistrationProfile]!
    GetOneRegistrationProfile(_id: ID!): RegistrationProfile!
  }

  #   Mutations
  type Mutation {
    CreateRegistrationProfile(
      registration_profile_name: String!
      scholarship_fee: Float!
      deposit: Float!
      registration_fee: Float!
      termination_of_payment_id: String!
    ): RegistrationProfile!
    UpdateRegistrationProfile(
      _id: ID!
      registration_profile_name: String
      scholarship_fee: Float
      deposit: Float
      registration_fee: Float
      termination_of_payment_id: String
    ): RegistrationProfile!
    DeleteRegistrationProfile(_id: ID!): String!
  }
`;

// *************** EXPORT MODULE ***************
module.exports = registrationProfiles;

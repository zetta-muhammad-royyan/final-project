// *************** Import Library ***************
const { gql } = require('apollo-server-express');

const registrationProfiles = gql`
  # Schemas
  type RegistrationProfiles {
    _id: ID!
    registration_profile_name: String!
    scholarship_fee: Float!
    deposit: Float!
    registration_fee: Float!
    termination_of_payment_id: ID!
  }

  # Inputs
  input RegistrationProfilesFilterInput {
    registration_profile_name: String
    termination_of_payment_id: String
  }

  input RegistrationProfilesSortingInput {
    registration_profile_name: String
    termination_of_payment_id: String
  }

  input RegistrationProfilesPaginationInput {
    page: Int!
    limit: Int!
  }

  # Queries
  type Query {
    GetAllRegistrationProfiles(
      pagination: RegistrationProfilesPaginationInput!
      filter: RegistrationProfilesFilterInput
      sort: RegistrationProfilesSortingInput
    ): [RegistrationProfiles]!
  }

  #   Mutations
  type Mutation {
    CreateRegistrationProfile(
      registration_profile_name: String!
      scholarship_fee: Float!
      deposit: Float!
      registration_fee: Float!
      termination_of_payment_id: String!
    ): RegistrationProfiles!
    UpdateRegistrationProfile(
      _id: ID!
      registration_profile_name: String!
      scholarship_fee: Float!
      deposit: Float!
      registration_fee: Float!
      termination_of_payment_id: String!
    ): RegistrationProfiles!
    DeleteRegistrationProfile(_id: ID!): String
  }
`;

module.exports = registrationProfiles;

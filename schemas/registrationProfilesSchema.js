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

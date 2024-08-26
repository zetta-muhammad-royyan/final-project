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
`;

module.exports = registrationProfiles;

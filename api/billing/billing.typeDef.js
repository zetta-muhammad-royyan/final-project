// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const billing = gql`
  # schemas
  type Billing {
    _id: ID!
    student: Student!
    registration_profile: RegistrationProfile!
    payer: Payer!
    total_amount: Float!
    paid_amount: Float!
    remaining_due: Float!
    terms: [Term]!
  }

  type Payer {
    _id: ID!
    civility: String!
    first_name: String!
    last_name: String!
  }
`;

// *************** EXPORT MODULE ***************
module.exports = billing;

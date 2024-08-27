// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');

// *************** IMPORT MODULE ***************
const RegistrationProfile = require('./registration_profile.model');

const Loader = new DataLoader(async (ids) => {
  const registrationProfile = await RegistrationProfile.find({ _id: { $in: ids } });
  const registrationProfileMap = {};
  registrationProfile.forEach((t) => {
    registrationProfileMap[t._id] = t;
  });

  return ids.map((id) => registrationProfileMap[id]);
});

// *************** EXPORT MODULE ***************
module.exports = Loader;

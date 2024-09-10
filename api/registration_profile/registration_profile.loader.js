// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');

// *************** IMPORT MODULE ***************
const RegistrationProfile = require('./registration_profile.model');

const Loader = new DataLoader(async (ids) => {
  //*************** batch registration profile
  const registrationProfile = await RegistrationProfile.find({ _id: { $in: ids } });

  //*************** mapping registration profile with it own id as a key
  const registrationProfileMap = {};
  registrationProfile.forEach((t) => {
    registrationProfileMap[t._id] = t;
  });

  return ids.map((id) => registrationProfileMap[id]);
});

// *************** EXPORT MODULE ***************
module.exports = Loader;

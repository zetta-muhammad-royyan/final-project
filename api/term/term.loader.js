// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');

// *************** IMPORT MODULE ***************
const Term = require('./term.model');

const Loader = new DataLoader(async (ids) => {
  const term = await Term.find({ _id: { $in: ids } });
  const termMap = {};
  term.forEach((t) => {
    termMap[t._id] = t;
  });

  return ids.map((id) => termMap[id]);
});

// *************** EXPORT MODULE ***************
module.exports = Loader;

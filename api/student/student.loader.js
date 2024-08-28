// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');

// *************** IMPORT MODULE ***************
const Student = require('./student.model');

const Loader = new DataLoader(async (ids) => {
  const student = await Student.find({ _id: { $in: ids } });
  const studentMap = {};
  student.forEach((t) => {
    studentMap[t._id] = t;
  });

  return ids.map((id) => studentMap[id]);
});

// *************** EXPORT MODULE ***************
module.exports = Loader;

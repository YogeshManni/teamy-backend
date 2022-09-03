const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  friends: Array,
  password: String,
  email: String,
  phone: String,
});
const onlineUsers = new mongoose.Schema({
  name: String,
  callerId: String,
});

const user = new mongoose.model("users", userSchema);
const peopleOnline = new mongoose.model("onlineUsers", onlineUsers);
module.exports = { user, peopleOnline };

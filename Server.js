const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const bodyParser = require("body-parser");
const io = socket(server);
const cors = require("cors");
//const https = require('https');
const mongoose = require("mongoose");
const { user, peopleOnline } = require("./model.js");

//Middelware
app.use(bodyParser.json());
app.use(cors());
const port = process.env.PORT || 5000;
const connectionUrl =
  "mongodb+srv://deep123:p0GopIwbEVP7oMiF@cluster0.akzi6.mongodb.net/teamsDb?retryWrites=true&w=majority";

mongoose
  .connect(connectionUrl)
  .then((res, err) => {
    if (err) throw err;
    console.log("Connected to mongodb");
  })
  .catch((err) => {
    console.log(err);
  });

//const options = {
//  key: fs.readFileSync('key.pem'),
//  cert: fs.readFileSync('cert.pem')
//};

const print = (response) => {
  console.log(`----------\n${response}\n-----------`);
};

const users = {};

io.on("connection", (socket) => {
  socket.emit("yourID", socket.id);

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.sockets.emit("allUsers", users);
  });

  socket.on("userName", (connectedUser) => {
    if (!users[socket.id]) {
      var obj = [];
      obj.push(socket.id);
      obj.push(connectedUser);
      users[socket.id] = obj;
      console.log(users);
    }
    io.sockets.emit("allUsers", users);
    //@createUser(connectedUser)
  });

  socket.on("removeUser", (userName) => {
    console.log("hello");
    for (let [i, v] of users.entries()) {
      console.log(i, v);
    }
  });
  socket.on("callUser", (data) => {
    //@  addFriend(data.friendName,data.callerName)
    io.to(data.userToCall).emit("hey", {
      signal: data.signalData,
      from: data.from,
      callerName: data.callerName,
      callerWidth: data.selfWidth,
      callerHeight: data.selfHeight,
    });
  });

  socket.on("acceptCall", (data) => {
    //@ addFriend(data.friendName,data.acceptorName)
    console.log(data.to);
    io.to(data.to).emit(
      "callAcceptedUser",
      data.signal,
      data.selfWidth,
      data.selfHeight
    );
  });

  socket.on("rejectCall", (data) => {
    //@ addFriend(data.friendName,data.acceptorName)
    io.to(data.to).emit("callRejected", data.signal);
  });
});

const addFriend = (friendName, userName) => {
  try {
    user.findOne({ username: userName }, (err, doc) => {
      if (err) throw err;
      if (doc) {
        isAlreadyFriend = doc.friends.filter((x) => x == friendName);
        if (isAlreadyFriend.length == 0) {
          doc.friends.push(friendName);
          doc.save();
          print(`Friend added to ${userName}'s list`);
        } else {
          print(`Friend already exist in ${userName}'s list`);
        }
      }
    });
  } catch (err) {
    print(`Failed to add friend to ${userName}'s list`);
  }
};

const userExist = async (userName) => {
  try {
    await user.findOne({ username: userName }, (err, doc) => {
      if (err) throw err;
      if (doc) {
        return true;
      }
      return false;
    });
  } catch (err) {
    return false;
  }
};

const getFriendsList = async (userName) => {
  try {
    await user.findOne({ username: userName }, (err, doc) => {
      if (err) throw err;
      if (doc) {
        return doc.friends;
      }
    });
  } catch (err) {
    return [];
  }
};

const createUser = async (userName) => {
  const ifUserExist = userExist(userName);
  try {
    if (!ifUserExist) {
      const newUser = new user();
      newUser.username = userName;
      newUser.friends = [];
      newUser.save();
      print(`user ${userName} created !!!`);
    } else {
      print(`user ${userName} joined !!!`);
    }
  } catch (err) {
    print(err);
  }
};

app.get("/", (req, res) => {
  res.status(200).send("Hey, Server is up fellas !!!");
});

// Create an HTTP service.
//http.createServer(app).listen(8000,() => console.log('server is running on port 8000'));
// Create an HTTPS service identical to the HTTP service.
//https.createServer(options, app).listen(443,() => console.log('server is running on port 443'));

server.listen(port, () => console.log(`server is running on port ${port}`));

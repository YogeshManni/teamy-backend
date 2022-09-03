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

/**************** Middelwares ****************/

app.use(bodyParser.json());
app.use(cors());

/********************* PORT ***********************/

const port = process.env.PORT || 5000;

/********************* Mongoose connection ****************************/
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

/*****************************************************************/

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
      obj.push(connectedUser.username);
      obj.push(connectedUser.isGuest);
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

const userExist = async (userName, userEmail) => {
  try {
    let res = await user.findOne({
      $or: [{ username: userName }, { email: userEmail }],
    });
    if (res) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    return false;
  }
};

app.post("/addFriend", async (req, res) => {
  try {
    const username = req.body.selfName;
    const friendname = req.body.friendName;
    user.findOne(
      {
        $or: [{ username: username }, { email: username }],
      },
      (err, doc) => {
        if (err) {
          res.status(500).send({ error: err });
        }
        doc.friends.push(friendname);
        doc.save();
        res.status(200).send({ message: "Successfully added friend to DB" });
      }
    );
  } catch (err) {
    res.status(500).send({ error: err });
  }
});

app.get("/getFriendList/:user", (req, res) => {
  try {
    const username = req.params.user;
    user.findOne(
      {
        $or: [{ username: username }, { email: username }],
      },
      (err, doc) => {
        if (err) {
          res.status(500).send({ error: err });
        }

        res
          .status(200)
          .send({ friends: doc.friends, message: "Successfully fetched list" });
      }
    );
  } catch (err) {
    res.status(500).send({ error: err });
  }
});

app.post("/createUser", async (req, res) => {
  let userData = req.body;
  const ifUserExist = await userExist(userData.nickname, userData.email);
  try {
    if (!ifUserExist) {
      const newUser = new user();
      newUser.username = userData.nickname;
      newUser.friends = [];
      newUser.password = userData.password;
      newUser.email = userData.email;
      newUser.phone = userData.phoneNumber;
      newUser.save();
      print(`user ${userData.nickname} created !!!`);
      res.status(200).send({ message: "User created Successfully" });
    } else {
      print(`user ${userData.nickname} already exist !!!`);
      res.status(500).send({
        message: "User already exist, please pick a different nickname",
      });
    }
  } catch (err) {
    print(err);
    res.status(500).send({ message: err });
  }
});

app.post("/login", async (req, res) => {
  let userData = req.body;
  const userFound = await user.findOne({
    $or: [{ username: userData.userName }, { email: userData.userName }],
  });
  if (userFound) {
    if (userFound.password == userData.password) {
      res.status(200).send({
        message: "Logged in Successfully !!",
        userName: userFound.username,
        status: 0,
      });
    } else {
      res.status(401).send({ message: "Invalid Password !!", status: 1 });
    }
  } else {
    res.status(401).send({
      message: "User not found, please check your credentials",
      status: 2,
    });
  }
});

app.get("/", (req, res) => {
  res.status(200).send("Hey, Server is up fellas !!!");
});

// Create an HTTP service.
//http.createServer(app).listen(8000,() => console.log('server is running on port 8000'));
// Create an HTTPS service identical to the HTTP service.
//https.createServer(options, app).listen(443,() => console.log('server is running on port 443'));

server.listen(port, () => console.log(`server is running on port ${port}`));

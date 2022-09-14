const path = require('path');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const socketio = require('socket.io');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const mongoose = require('mongoose');
const moment = require('moment');
require('dotenv').config();

// Collect helpers
const formatMessage = require('./helpers/formatDate');
const {
  getActiveUser,
  exitRoom,
  newUser,
  getIndividualRoomUsers
} = require('./helpers/userHelper');
const user = require('./models/User');
const { time } = require('console');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

var urlencodedParser = bodyParser.urlencoded({extended: false}); // Necessary for req.body.* to work

const test_db = process.env.test_db;
const db = mongoose.createConnection(test_db);

const room_db = process.env.room_db;
const db2 = mongoose.createConnection(room_db);

// Set up databases
db.on('error', (error) => {
  console.log(error);
});
db.once('connected', () => {
  console.log('Database Connected');
});

db2.on('error', (error) => {
  console.log(error);
});
db2.once('connected', () => {
  console.log('Database Connected');
});

const User = db.model('User', require('./models/User'));
let rooms = {
  Advice: db2.model('AdviceMsg', require('./models/Msg')),
  Connect: db2.model('ConnectMsg', require('./models/Msg')),
  Social: db2.model('SocialMsg', require('./models/Msg'))
};

const duration = 1000 * 60 * 60; // 5 minutes

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessions({
    secret: process.env.secretkey,
    saveUninitialized: true,
    cookie: { maxAge: duration },
    resave: false
}));
app.use(cookieParser());
let session;

// Set public folder
app.use(express.static(path.join(__dirname, 'public')));

// this block will run when the client connects
io.on('connection', socket => {

  socket.on('joinApp', () => {
    const user = newUser(socket.id, session.name, null);
    console.log(socket.id + ' 1');
  });

  socket.on('joinRoom', room => {
    const user = getActiveUser(socket.id);
    user.room = room;
    console.log(socket.id + ' 2');

    socket.join(user.room);

    // Broadcast everytime users connects
    io.to(user.room)
      .emit(
        'message',
        formatMessage("CocoChat", `${user.username} has joined the room`, moment().format('h:mm a, MMM Do'))
      );
  });

  // Listen for client message
  socket.on('chatMessage', async msg => {
    const user = getActiveUser(socket.id);
    
    saveMsg({
      name: user.username,
      txt: msg,
      time: moment().format('h:mm a, MMM Do')
    }, user.room).catch(error => {console.error(error)});

    io.to(user.room).emit('message', formatMessage(user.username, msg, moment().format('h:mm a, MMM Do')));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = exitRoom(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage("WebCage", `${user.username} has left the room`)
      );

      // Current active users and room name
      io.emit('rooms', {
        rooms_: Object.keys(rooms),
        username_: session.name
      });
    }
  });
});

async function getUser(body) {
  const user = await User.findOne({email: body.email});
  if (body.password == user.password) return user;
  return null;
}

async function saveUser(user) {
  const u = new User(user);
  const doc = await u.save();
  console.log(doc);
}

async function saveMsg(msg, room) {
  const m = new rooms[room](msg);
  const doc = await m.save();
  console.log(doc);
}

async function getMsgs(room) {
  const msgs = await rooms[room].find();
  let result = [];
  msgs.forEach(msg => {
    result.push(formatMessage(msg.name, msg.txt, msg.time));
  });
  return result;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});

app.post('/', urlencodedParser, async (req, res) => {
  const user = await getUser(req.body);
  console.log(user);
  if (user) {
    session = req.session;
    session.email = req.body.email;
    session.name = user.fname + ' ' + user.lname;
    console.log(req.session);
    return res.redirect('/chat');
  }
  return res.redirect('/');
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/signup.html'));
});

app.post('/signup', urlencodedParser, (req, res) => {
  saveUser({
    fname: req.body.fname,
    lname: req.body.lname,
    email: req.body.email,
    password: req.body.password
  }).catch(error => {console.error(error)});
  return res.redirect('/');
});

app.get('/chat/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/chat.html'));
});

app.get('/logout',(req,res) => {
  req.session.destroy();
  session = null;
  res.redirect('/');
});

app.get('/doc_setup', (req, res) => {
  res.send({username: session.name, rooms: Object.keys(rooms)});
});

app.get('/room_setup/:room', async (req, res) => {
  msgs = await getMsgs(req.params.room);
  console.log(msgs);
  res.send(msgs);
})

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
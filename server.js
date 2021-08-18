//if we are in development, require the dotenv npm package. This loads all our env variables into process.env
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

//express server
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

//socket.io
const { Server } = require("socket.io");
const io = new Server(server);

//database setup
const mongoose = require('mongoose');
const db = require("./config/db.config.js");
const authRoute = require('./routes/auth.route');
app.use('/api', authRoute)


//authentication
const bcrypt = require('bcrypt'); // hash user passwords
const initializePassport = require('./config/passport.config');
const passport = require('passport');
const flash = require('express-flash'); //displays login success/failure messages
const session = require('express-session'); //stores variables to be used persistently across the entire session our user has
const methodOverride = require('method-override');
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
  )


app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false })); // take the forms and access them inside the req in post methods.
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false, //we don't want to save if nothing has changed
  saveUninitialized: false //don't save empty values
}))
app.use(passport.initialize())
app.use(passport.session()) 
app.use(methodOverride('_method'))

app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs');
});

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))


app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs');
});

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPW = await bcrypt.hashSync(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPW
    });
    res.redirect('/login'); //is all is well, redirect to login page
  } catch {
    res.redirect('/register'); //if something goes wrong redirect to register page
  }
  console.log(users);
});

app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/login')
}
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
      io.emit('chat message', msg);
    });
  });

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

server.listen(port, () => {
  console.log('Server has started successfully');
});
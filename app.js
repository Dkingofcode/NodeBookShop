const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const errorController = require('./controllers/error');
const User = require('./models/user');

const MONGODB_URI = '';

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

const filestorage = multer.diskStorage({
   destination: (req, file, cb) => {
     cb(null, 'images')
   },
   filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname)
   }
});

const fileFilter = (req, file, cb) => {
  if(file === 'jpg' || file === 'png' || file === 'jpeg'){

    cb(null, true);
  }else{
    cb(null, false);
  }
  
}

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const csrfProtection = csrf();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(session({secret: 'password', resave: false, saveUninitialized: false, store: store }));
app.use(multer({ storage: filestorage, fileFilter: fileFilter }).single('image'))
app.use(csrf());
app.use(flash());

app.use((req, res, next) => {
  if(!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if(!user){
        return next();
      }

      req.user = user;
      next();
    })
    .catch(err =>{
      throw new Error();
      //console.log(err);
       //next();
    } 
    );
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
})

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(errorController.get404);

app.use('/500', errorController.get500);

app.use((error, req, res, next) => {
    res.redirect('/500');
});

mongoose
  .connect(
    'mongodb+srv://maximilian:9u4biljMQc4jjqbe@cluster0-ntrwp.mongodb.net/shop?retryWrites=true'
  )
  .then(result => {
    User.findOne().then(user => {
      if (!user) {
        const user = new User({
          name: 'Max',
          email: 'max@test.com',
          cart: {
            items: []
          }
        });
        user.save();
      }
    });
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });

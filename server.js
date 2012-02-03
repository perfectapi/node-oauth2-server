var express = require('express');
var perfectapi = require('perfectapi');

var app = express.createServer();
app.configure(function(){
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: "MyHG9LYhtMZxZynSAyDj" }));
  app.use(app.router);
});

app.configure('development', function(){
  app.use('/public', express.static(__dirname + '/public'));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  var oneYear = 31557600000;
  app.use('/public', express.static(__dirname + '/public', { maxAge: oneYear }));
  app.use(express.errorHandler());
});

var userDbLocation = 'http://localhost:3001/userdb';
perfectapi.proxy(userDbLocation, function(err, userdb) {

  app.get('/register/user', function(req, res) {
    //allow a user to register themselves
    res.render('registeruser.ejs', {
      title: "Register as user",
      script: "registeruser.js",
      userdb: userDbLocation,
      loggedIn: (req.session.token) ? true: false
    });
  });
  app.post('/register/user', function(req, res) {
    //ajax postback for user registration
    var config = {email: req.param('email'), options: {password: req.param('password')} };
    userdb.addUser(config, function(err, result) {
      if (err || result.err) return res.json('Failed to add user');
      
      res.json('User registered successfully');
    })
  });

  app.get('/login', function(req, res){
    //Login to site
    res.render('login.ejs', {
      title: "Login to site",
      script: "login.js",
      userdb: userDbLocation,
      loggedIn: (req.session.token) ? true: false
    });
  });
  app.post('/login', function(req, res) {
    //ajax postback for login
    var config = {email:req.param('email'),options:{password:req.param('password')}};
    userdb.login(config, function(err, result) {
      if (err || result.err) return res.json('Login failed');
      
      req.session.token = result.SECURE_TOKEN;
      res.json('User logged in successfully');
    });
  });

  app.get('/register/client', function(req, res) {
    //Register a client (application) for OAUTH2
    var token = req.session.token;
    if (!token) return res.redirect('/login');
    
    var config = {environment:{SECURE_TOKEN: token}};
    userdb.listOAuth2Clients(config, function(err, result) {
      res.render('registerclient.ejs', {
        title: "Register client applications",
        script: "registerclient.js",
        userdb: userDbLocation,
        err: err,
        existingClients: result,
        loggedIn: (req.session.token) ? true: false
      });
    })     
  });
  app.post('/register/client', function(req, res) {
    var token = req.session.token;
    if (!token) return res.redirect('/login');
    
    var config = {
      environment:{SECURE_TOKEN: token},
      name: req.param('name'),
      options: {redirectEndpoint: req.param('endpoint'),
        clientType: req.param('clientType')}
    };
    console.log(config)
    userdb.registerOauth2Client(config, function(err, result) {
      res.redirect('/register/client');
    });
  })

  app.get('/authorize', function(req, res) {
    //OAUTH2 authorization endpoint
  });

  app.get('/gettoken', function(req, res) {
    //OAUTH2 token endpoint
  });

  app.listen(3000);

});





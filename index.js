const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
const { Client } = require('pg');
const url = require('url');
// const pg = require('pg');
//const connectionString = "postgres://zdhslclmzvbikp:6dc993f483fb00f2106f9ee5ceacbdafdf33cd9ea5903fdd566d0bcee98981cc@ec2-54-221-212-15.compute-1.amazonaws.com:5432/ddq4drb00dvcn3";
const client = new Client({
	user: 'zdhslclmzvbikp',
	host: 'ec2-54-221-212-15.compute-1.amazonaws.com',
	database: 'ddq4drb00dvcn3',
	password: '6dc993f483fb00f2106f9ee5ceacbdafdf33cd9ea5903fdd566d0bcee98981cc',
	port: 5432,
});

// const pool = new Pool({
// 	user: 'zdhslclmzvbikp',
// 	host: 'ec2-54-221-212-15.compute-1.amazonaws.com',
// 	database: 'ddq4drb00dvcn3',
// 	password: '6dc993f483fb00f2106f9ee5ceacbdafdf33cd9ea5903fdd566d0bcee98981cc',
// 	port: 5432,
// });

var userLoggedIn;

var videoId;

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/main', (req, res) => {
  	if(userLoggedIn == null){
  		res.render('pages/loginpage');
  	}
  	else {
  		/* redirect to /home */
  	}
  })
  .get('/verify', (req, res) => {
  	var q = url.parse(req.url, true);
  	var qdata = q.query;
  	var usrname = qdata.username;
  	var pass  = qdata.password;

  	userLoggedIn = verifyUser(username, password);

  	if (userLoggedIn != null){
  		/* redirect to /home */
  	}
  	else {
  		/* redirect to login */
  	}
  })
  .get('/create_account', (req, res) => {
  	var w = url.parse(req.url, true);
  	var wdata = w.query;
  	var newuser = wdata.newuser;
  	var newpass = wdata.newpass;

  	addUser(newuser, newpass);
  	/* redirect to login */
  })
  .get('/home', (req, res) => {
  	if(userLoggedIn != null){
  		/* Loop through the database and output the list of videos,
  	   	somehow storing their IDs. Once one is clicked, use the ID
  	   	to assign the videoID var, then send to /watch */
  		var table = getTable(req, res);
  		res.render('pages/homepage', {table : table}); // To be written
  	}
  	else {
  		/* redirect to /login */
  	}
  })
  .get('/watch', (req, res) => {
  	videoId = '0r-4Nve8tHE'; // A placeholder.
  	res.render('pages/test', {videoId : videoId});
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

/* Querys the Database to get the table of Youtube video IDs */
function getTable(req, res){
	console.log('Displaying table...');

	client.connect();

	client.query("SELECT * FROM videos AS u JOIN users AS n ON u.userId = n.id", (err, res) => {
		console.log(err, res);
		client.end();
	});

	// var client = new pg.Client(connectionString);

	// client.connect(function(err) {
	// 	if (err){
	// 		console.log("Error connecting to DB: ")
	// 		console.log(err);
	// 	}
	// 	var sql = "SELECT * FROM videos AS u JOIN users AS n ON u.userId = n.id";
	// 	var query = client.query(sql, function(err, result) {
	// 		client.end(function(err) {
	// 			if (err) throw err;
	// 		});

	// 		if (err) {
	// 			console.log("Error in query: ")
	// 			console.log(err);
	// 		}

	// 		console.log("Found result: " + JSON.stringify(result.rows));
	// 	});
	// });

	// pool.connect((err, client, done) => {
	// 	if (err) throw err;
	// 	client.query('SELECT * FROM videos AS u JOIN users AS n ON u.userId = n.id', (err, res) => {
	// 		done();

	// 		if (err) {
	// 			console.log(err.stack);
	// 		}
	// 		else {
	// 			console.log(res.rows[0])
	// 		}
	// 	});
	// });
}

/* Verifies the User Exists */
function verifyUser (usrname, pass){
	client.connect();

	var sql = "SELECT * FROM users";
	var query = client.query(sql, function(err, res) {
		client.end(function(err) {
			if (err) throw err;
		});

		if (err) {
			console.log("Error in query: ")
			console.log(err);
		}

		if (usrname == res.rows[0].username && pass == res.rows[0].password){
			return usrname;
		}
		else {
			return null;
		}

	})
}

function newUser(newuser, newpass){
	var query = {
		text: 'INSERT INTO users(username, password) VALUES ($1, $2)',
		values: [newuser, newpass],
	}

	client.query(query, (err, res) => {
		if (err){
			console.log(err.stack);
		}
		else{
			console.log('Adding new user: ')
			console.log(res.rows[0]);
		}
	});
}
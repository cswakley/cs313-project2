/*
* TODO: Add comments.
*/
const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
const { Pool, Client } = require('pg');
const url = require('url');
const app = express();
const bcrypt = require('bcrypt');
const saltRounds = 10;

const connectionString = "postgres://zdhslclmzvbikp:6dc993f483fb00f2106f9ee5ceacbdafdf33cd9ea5903fdd566d0bcee98981cc@ec2-54-221-212-15.compute-1.amazonaws.com:5432/ddq4drb00dvcn3";

const pool = new Pool({
	connectionString: process.env.DATABASE_URL || connectionString,
	ssl: true,
});

const client = new Client({
	connectionString: process.env.DATABASE_URL || connectionString,
	ssl: true,
});

var session = require('express-session');

//var userLoggedIn = null;

var videoId;

/*********************************************************** 
* 
***********************************************************/
app.use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .use(express.json())
  .use(express.urlencoded())
  .use(session({secret:"super secret"}))
  .get('/', (req, res) => res.render('pages/index'))
  .get('/main', (req, res) => {
  	//if(userLoggedIn == null){
  	// if(req.session.username == null){
  	// 	res.render('pages/loginpage');
  	// }
  	// else {
  	// 	/* redirect to /home */
  	// 	res.redirect('/home');
  	// }
  	res.render('pages/loginpage');
  })
  .post('/verify', (req, res, next) => {
  	var usrname = req.body.username;
  	var pass = req.body.password;

  	verifyUser(usrname, pass, function(err, result){
	  	if (result != null){
	  		console.log("Back from the Verify User.")
	  		console.log(req.session.username);
	  		// userLoggedIn = result;
	  		// console.log(userLoggedIn);
	  		req.session.username = result;
	  		console.log(req.session.username);
	  		/* redirect to /home */
	  		res.redirect('/home');
	  	}
	  	else {
	  		console.log("Back from the Verify User, but in the Else statement.")
	  		// app.handle(req, res);
	  		res.redirect('/main');
	  	}
  	});
  })
  .post('/create_account', (req, res) => {
  	var newuser = req.body.newuser;
  	var newpass = req.body.newpass;
  	var passconf = req.body.newpassconf;

  	addUser(newuser, newpass, passconf, function(err, result){
  		if (result == false){
  			/* Handle failure to create account */
  			console.log(err);
  		}
  		else {
  			res.redirect('/main');
  		}
  	});
  })
  .get('/home', (req, res) => {
  	//if(userLoggedIn != null){
  	if(req.session.username != null){
  		/* Loop through the database and output the list of videos,
  	   	somehow storing their IDs. Once one is clicked, use the ID
  	   	to assign the videoID var, then send to /watch */

  		getTable(req, res, function(err, result){
  			res.render('pages/homepage', {table : result});
  		});
  	}
  	else {
  		res.redirect('/main');
  	}
  })
  .get('/watch', (req, res) => {
  	var v = url.parse(req.url, true);
  	var vdata = v.query;
  	videoId = vdata.id;

  	res.render('pages/test', {videoId : videoId});
  })
  .get('/comments', (req, res) => {
  	var c = url.parse(req.url, true);
  	var cdata = c.query;
  	var vid = cdata.vid;

  	console.log(vid);

  	getComment(vid, function(err, result){
  		res.send(result);
  	});

  })
  .get('/addcomment', (req, res) => {
  	var a = url.parse(req.url, true);
  	var adata = a.query;
  	var vidId = adata.videoId;
  	var message = adata.message;

  	// addComment(vidId, message, userLoggedIn);
  	addComment(vidId, message, req.session.username);

  	res.redirect(req.get('referer'));
  })
  .get('/addnewvideo', (req, res) => {
  	var n = url.parse(req.url, true);
  	var ndata = n.query;
  	var newvid = ndata.videoid;

  	addVideo(newvid, req.session.username, function(err){
  		res.redirect('/home');
  	});
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

/*********************************************************** 
* Querys the Database to get the table of Youtube video IDs 
***********************************************************/
function getTable(req, res, callback){
	console.log('Displaying table...');

	var result;

	pool.connect((err, client, done) => {
		if (err) throw err;
		client.query('SELECT * FROM videos AS u JOIN users AS n ON u.userId = n.id', (err, res) => {
			done();

			if (err) {
				console.log(err.stack);
			}
			else {
				result = res.rows;

				callback(null, result);
			}
		});
	});
}

/*********************************************************** 
* Verifies the User Exists 
***********************************************************/
function verifyUser (usrname, pass, callback){
	client.connect();

	var check;
	var sql = "SELECT * FROM users WHERE username = '" + usrname + "'";
	var query = client.query(sql, function(err, res) {
		client.end(function(err) {
			if (err) throw err;
		});

		if (err) {
			console.log("Error in query: ")
			console.log(err);
		}

		check = res.rows[0];

		console.log(check.username);

		bcrypt.compare(pass, check.password, function(err, res) {
			console.log(res);
			if (usrname == check.username && res) {
				console.log("Inside the if found");
				callback(null, usrname);
			}
			else {
				console.log("Inside the NOT found");
				callback(null, null);
			}
		});
	});
}

/*********************************************************** 
* 
***********************************************************/
function addUser(newuser, newpass, passconf, callback){
	if(newpass == passconf){
		bcrypt.hash(newpass, saltRounds, function(err, hash){
			console.log(hash);
			
			client.connect();

			var	text = 'INSERT INTO users(username, password) VALUES ($1, $2)';
			var	values = [newuser, hash];

			client.query(text, values, (err, res) => {
				if (err) {
					console.log(err.stack);
				}
				else {
					console.log('Adding new user...');
					callback(null, true);
				}
				//client.end();
			});
		});
	}
	else {
		callback('Passwords do not match!', false);
	}
}

/*********************************************************** 
* 
***********************************************************/
function getComment(vid, callback){
	var result;

	pool.connect((err, client, done) => {
		if (err) throw err;
		client.query('SELECT * FROM comments AS u JOIN users AS n ON u.userId = n.id JOIN videos AS k ON u.videoId = k.id', (err, res) => {
			done();

			if (err) {
				console.log(err.stack);
			}
			else {
				result = res.rows;

				callback(null, result);
			}
		});
	});
}

/*********************************************************** 
* 
***********************************************************/
function addComment(vidId, message, userLoggedIn){
	client.connect();
	var video;
	var user;
	
	pool.connect((err, client, done) => {
		if (err) throw err;

		let query = 'INSERT INTO comments(message, userid, videoid)\
		VALUES ($1,\
		(SELECT id FROM users WHERE username = $2),\
		(SELECT id FROM videos WHERE videocode = $3))';

		let params = [ message, userLoggedIn, vidId ];

		client.query(query, params, (err, res) => {
			if (err) {
				console.log(err.stack);
			}
			else {
				console.log('Adding new comment...')
			}
		});
	});
}

/***********************************************************
* 
***********************************************************/
function addVideo(vidId, userLoggedIn, callback){
	pool.connect((err, client, done) => {
		if (err) throw err;

		let query = 'INSERT INTO videos(videocode, userid)\
		VALUES ($1,\
		(SELECT id FROM users WHERE username = $2))';

		let params = [ vidId, userLoggedIn ];

		client.query(query, params, (err, res) => {
			if (err) {
				console.log(err.stack);
			}
			else {
				console.log('Adding new video...')
				callback(null);
			}
		});
	});
}
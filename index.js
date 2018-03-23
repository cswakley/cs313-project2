/*
* TODO: Add comments.
* TODO: Change some GET requests to POST
*/
const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
const { Pool, Client } = require('pg');
const url = require('url');
const app = express();

const connectionString = "postgres://zdhslclmzvbikp:6dc993f483fb00f2106f9ee5ceacbdafdf33cd9ea5903fdd566d0bcee98981cc@ec2-54-221-212-15.compute-1.amazonaws.com:5432/ddq4drb00dvcn3";

const pool = new Pool({
	connectionString: process.env.DATABASE_URL || connectionString,
	ssl: true,
});

const client = new Client({
	connectionString: process.env.DATABASE_URL || connectionString,
	ssl: true,
});

var userLoggedIn;

var videoId;

app.use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/main', (req, res) => {
  	if(userLoggedIn == null){
  		res.render('pages/loginpage');
  	}
  	else {
  		/* redirect to /home */
  		req.url = '/home';
  		app.handle(req, res);
  	}
  })
  .get('/verify', (req, res) => {
  	var q = url.parse(req.url, true);
  	var qdata = q.query;
  	var usrname = qdata.username;
  	var pass  = qdata.password;

  	verifyUser(usrname, pass, function(err, result){
	  	if (result != null){
	  		userLoggedIn = result;
	  		/* redirect to /home */
	  		req.url = '/home';
	  		app.handle(req, res);
	  	}
	  	else {
	  		/* redirect to login */
	  		req.url = '/main';
	  		app.handle(req, res);
	  	}
  	});
  })
  .get('/create_account', (req, res) => {
  	var w = url.parse(req.url, true);
  	var wdata = w.query;
  	var newuser = wdata.newuser;
  	var newpass = wdata.newpass;

  	addUser(newuser, newpass);
  	/* redirect to login */
  	req.url = '/main';
  	app.handle(req, res);
  })
  .get('/home', (req, res) => {
  	if(userLoggedIn != null){
  		/* Loop through the database and output the list of videos,
  	   	somehow storing their IDs. Once one is clicked, use the ID
  	   	to assign the videoID var, then send to /watch */

  		getTable(req, res, function(err, result){
  			//console.log(result);
  			res.render('pages/homepage', {table : result});
  		});
  	}
  	else {
  		/* redirect to /login */
  		req.url = '/main';
  		app.handle(req, res);
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

  	var test = [{
  		username:'test',
  		message:'gosh I hope this works',
  	}, {
  		username:'Woot',
  		message:'pls wrk',
  	}, {
  		username:'doubter091',
  		message:'it works dingus',
  	}];

  	getComment(vid, function(err, result){
  		res.send(result);
  	});

  	//res.send(test);
  })
  .get('/addcomment', (req, res) => {
  	var a = url.parse(req.url, true);
  	var adata = a.query;
  	var vidId = adata.videoId;
  	var message = adata.message;

  	addComment(vidId, message, userLoggedIn);
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

/* Querys the Database to get the table of Youtube video IDs */
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

/* Verifies the User Exists */
function verifyUser (usrname, pass, callback){
	client.connect();

	var check;
	var sql = "SELECT * FROM users";
	var query = client.query(sql, function(err, res) {
		client.end(function(err) {
			if (err) throw err;
		});

		if (err) {
			console.log("Error in query: ")
			console.log(err);
		}

		check = res.rows;

		check.forEach( function(r){
			console.log(r.username);
			console.log(usrname);
			if (usrname == r.username && pass == r.password){
				callback(null, usrname);
			}
			else {
				callback(null, null);
			}
		});
	});
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

function addComment(vidId, message, userLoggedIn){
	client.connect();
	var video;
	var user;
	
	pool.connect((err, client, done) => {
		if (err) throw err;
		client.query('SELECT id FROM users WHERE username = $1', [userLoggedIn], (err, res) => {
			done();

			if (err) {
				console.log(err.stack);
			}
			else {
				user = res.rows;
			}
		});

		client.query('SELECT id FROM videos WHERE videocode = $1', [vidId], (err, res) => {
			done();

			if (err) {
				console.log(err.stack);
			}
			else {
				video = res.rows;
			}
		});

		client.query('INSERT INTO comments(message, userid, videoid) VALUES ($1, $2, $3)', [message, user, video], (err, res) => {
			done();

			if (err) {
				console.log(err.stack);
			}
			else {
				console.log('Adding new comment: ')
				console.log(res.rows);
			}
		});
	});
}
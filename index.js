const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

var fs = require('fs');
var youtubedl = require('youtube-dl');
var video = youtubedl('https://www.youtube.com/watch?v=FZUcpVmEHuk', ['--format=18'], {cwd: __dirname});

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/test', (req, res) => {
  	res.render('pages/test');
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

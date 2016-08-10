var express = require('express')
var app = express()
var ejs = require('ejs')
app.engine('html', ejs.renderFile)
app.listen(2000)

app.get('/', home)
app.get('/register', register)

function home(req, res) {
	res.render('index.html')
}

function register(req, res) {
	res.render('register.html')
}

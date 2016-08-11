const database = "mongodb://127.0.0.1/test1"

var express = require('express')
var app = express()
var ejs = require('ejs')
var mongo = require('mongodb')
var client = mongo.MongoClient
var crypto = require('crypto')

app.engine('html', ejs.renderFile)
app.listen(2000)
app.use(check)
app.get('/', home)
app.get('/register', register)
app.post('/register', registerUser)

function check(req, res, next) {
	if (req.get('Cookie') == null) {
		var t1 = parseInt(Math.random() * 100000000)
		var t2 = parseInt(Math.random() * 100000000)
		req.token = t1 + '-' + t2
		res.set('Set-Cookie', 'token=' + req.token)
	} else {
		var s = req.get('Cookie') + ';'
		var start = s.indexOf('token=') + 6
		var stop  = s.indexOf(';', start)
		req.token = s.substring(start, stop)
	}
	next()
}

function registerUser(req, res) {
	var data = ""
	req.on("data", chunk => {
		data += chunk
	})
	req.on("end", () => {
		// name=Bill Gates&email=bill@ms.com&password=bill123
		var o = {}
		data = decodeURIComponent(data)
		data = data.replace('+', ' ')
		var a = data.split('&')
		for (var i = 0; i < a.length; i++) {
			var f = a[i].split('=')
			o[f[0]] = f[1]
		}
		o.password = crypto.createHmac('sha256', o.password)
						.digest('hex')
		client.connect(database, (error, db) => {
			db.collection("user").find(
				{email: o.email}
			).toArray((error, data) => {
				if (data.length == 0) {
					db.collection("user").insert(o)
					res.redirect("/")
				} else {
					res.redirect("/register?duplicated email")
				}
			})
		})
	})
}

function home(req, res) {
	res.render('index.html')
}

function register(req, res) {
	res.render('register.html')
}

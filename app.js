var fs      = require('fs')
var express = require('express')
var app     = express()
var ejs     = require('ejs')
var mongo   = require('mongodb')
var client  = mongo.MongoClient
var crypto  = require('crypto')
var multer  = require('multer')
var upload  = multer({dest:'./uploads'})

var approved   = [ ]
const database = "mongodb://127.0.0.1/test1"

app.engine('html', ejs.renderFile)
app.listen(2000)
app.use(check)
app.use(express.static('public'))
app.use(express.static('uploads'))

app.get ('/',         home)
app.get ('/register', register)
app.post('/register', registerUser)
app.get ('/login',    login)
app.post('/login',    checkLogin)
app.get ('/profile',  profile)
app.post('/profile',  upload.single('picture'), updateProfile)
app.get ('/logout',   logout)
app.get (['/contact', '/contact-us'], showContact)
app.use (showError)

function updateProfile(req, res) {
	var ext = ""
	if (req.file != null) {
		if (req.file.mimetype == "image/png") {
			ext = ".png"
		} else if (req.file.mimetype == "image/jpeg") {
			ext = ".jpg"
		}
	}

	if (ext == "") {
		var o = {email: approved[req.token].email}
		var n = approved[req.token]
		n.name = req.body.user
		client.connect(database,
			(error, db) => db.collection("user").update(o, n))
	} else {
		fs.rename("./uploads/" + req.file.filename,
				  "./uploads/" + req.file.filename + ext)
		var o = {email: approved[req.token].email}
		var n = approved[req.token]
		n.name = req.body.user
		n.picture = req.file.filename + ext
		client.connect(database, 
			(error, db) => db.collection("user").update(o, n))
	}
	res.redirect("/profile")
}

function showContact(req, res) {
	res.render('contact.html')
}

function showError(req, res) {
	res.status(404).send("Error 404 Not Found")
}

function logout(req, res) {
	delete approved[req.token]
	res.render('logout.html')
}

function checkLogin(req, res) {
	var data = ''
	req.on('data', chunk => data += chunk)
	req.on('end', () => {
		var o = {}
		data = decodeURIComponent(data)
		var a = data.split('&')
		for (var i = 0; i < a.length; i++) {
			var f = a[i].split('=')
			o[f[0]] = f[1]
		}
		o.password = crypto.createHmac('sha256', o.password)
						.digest('hex')
		client.connect(database, (error, db) => {
			db.collection('user').find(o).toArray(
				(error, data) => {
				if (data.length == 1) {
					approved[req.token] = data[0]
					res.redirect("/profile")
				} else {
					res.redirect("/login?invalid password")
				}
			})
		})
	})
}

function profile(req, res) {
	if (approved[req.token]) {
		var model = { }
		model.user = approved[req.token]
		res.render('profile.html', model)
	} else {
		res.redirect('/login')
	}
}

function login(req, res) {
	res.render('login.html')
}

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
	req.on("data", chunk => data += chunk )
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

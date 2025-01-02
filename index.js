
const express = require("express");
const path = require('path'); // use path to resolve the path to the static files
const mysql = require('mysql');
const bcrypt = require('bcrypt'); // use bcrypt for password hashing
const dotenv = require('dotenv'); //use dotenv for environment variables
dotenv.config({ path: './.env' });

// middleware 
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// View Engine
app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "views")));
app.use(express.static(path.join(__dirname, "public")));

// Database Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "nodejs_login" 
});

db.connect((err) => {
    if (err) {
        console.error("Database connection error: ", err);
    } else {
        console.log("MySQL connected...");
    }
});

//  Function: Validate Email
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Validation Function
const validateSignup = (username, email, phone, password, confirmpassword) => {
    const errors = {};
    if (!username || !username.trim()) errors.username = '*Username is required';
    if (!email || !email.trim()) errors.email = '*Email is required';
    else if (!isValidEmail(email)) errors.email = '*Provide a valid email address';
    if (!phone || !phone.trim()) errors.phone = '*Phone number is required';
    else if (phone.length !== 10) errors.phone = '*Phone number must be exactly 10 digits';
    if (!password || !password.trim()) errors.password = '*Password is required';
    else if (password.length < 6) errors.password = '*Password must be at least 6 characters long';
    if (confirmpassword !== password) errors.confirmpassword = '*Passwords do not match';
    return errors;
};

// Routes
app.get('/', (req, res) =>
     res.render('index', { errors: {} })
);
app.get('/signup', (req, res) => 
    res.render('signup', { errors: {} })
);

app.post('/signup', async (req, res) => {
    const { username, email, phone, password, confirmpassword } = req.body;
    const errors = validateSignup(username, email, phone, password, confirmpassword);

    if (Object.keys(errors).length > 0) {
        return res.render('signup', { errors });
    }

    db.query("SELECT email FROM user_data WHERE email = ?", [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Server error");
        }
        if (results.length > 0) {
            return res.render('signup', { errors: { email: '*Email is already in use' } });
        }

        const hashedPassword = await bcrypt.hash(password, 8);
        db.query(
            'INSERT INTO user_data (username, email, phone, password) VALUES (?, ?, ?, ?)',
            [username, email, phone, hashedPassword],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Server error");
                }
                res.redirect('/login');
            }
        );
    });
});

app.get('/login', (req, res) => res.render("login", { errors: {} }));

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render("login", { errors: { general: 'Username and password are required' } });
    }

    db.query('SELECT * FROM user_data WHERE username = ?', [username], async (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            return res.render("login", { errors: { general: 'Invalid username or password' } });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.render("login", { errors: { general: 'Invalid username or password' } });
        }

        // res.status(200).send('Login successful!');
        res.redirect('/');
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

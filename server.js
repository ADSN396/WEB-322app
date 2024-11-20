/*********************************************************************************

WEB322 – Assignment 04
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part * of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Adson Davis
Student ID: 164876229
Date: 11-17-2024
Cyclic Web App URL: https://9a3538ba-9729-4ace-b998-5da6af0ecc27-00-23uy33uzyw249.worf.replit.dev/
GitHub Repository URL: https://github.com/ADSN396/WEB-322app.git

********************************************************************************/ 
const express = require("express");
const app = express();
const path = require("path");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const storeService = require("./store-service");
const cookieParser = require('cookie-parser');
const clientSessions = require('client-sessions');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Set up EJS
app.set('view engine', 'ejs');

// Middleware for static files, form data, cookies, and sessions
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(clientSessions({
    cookieName: "session",
    secret: "web322_assignment4_secret_key",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60
}));

// Middleware to make 'user' available to all views
app.use((req, res, next) => {
    res.locals.user = req.session ? req.session.user : null;
    next();
});

// Cloudinary configuration
cloudinary.config({
    cloud_name: "djm2rlpji",
    api_key: "537865289241387",
    api_secret: "NYU_WJDrJXa99k5yKkpkYnRPngA",
    secure: true
});

// Multer setup for file uploads
const upload = multer();

// Middleware for session validation
function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

// Helper functions to manage user data in a local JSON file
const readUserData = () => {
    try {
        const data = fs.readFileSync('users.json', 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

const writeUserData = (data) => {
    fs.writeFileSync('users.json', JSON.stringify(data, null, 4));
};

// Middleware to set active route for navigation bar highlighting
app.use(function(req, res, next){
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

// Routes

// Redirect root to /shop
app.get("/", (req, res) => {
    res.redirect("/shop");
});

// Render about page using EJS
app.get("/about", (req, res) => {
    res.render("about", { title: "About Us" });
});


// Render addItem page using EJS
app.get("/items/add", ensureLogin, (req, res) => {
    res.render("addPost", { title: "Add Item", user: req.session.user });
});

// Handle form submission for adding a new item
app.post("/items/add", upload.single("featureImage"), (req, res) => {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream((error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                });
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            return result;
        }

        upload(req).then((uploaded) => {
            processItem(uploaded.url);
        }).catch((err) => {
            res.status(500).send("Error uploading image: " + err.message);
        });
    } else {
        processItem(""); // Continue without a featureImage if none was uploaded
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;

        // Save the new item using storeService.addItem
        storeService.addItem(req.body)
            .then(() => {
                res.redirect("/items"); // Redirect to /items after successful addition
            })
            .catch((err) => {
                res.status(500).send("Unable to add item: " + err.message);
            });
    }
});



// Render login page
app.get("/login", (req, res) => {
    res.render("login", { title: "Login", error: null });
});

// Render register page
app.get("/register", (req, res) => {
    res.render("register", { title: "Register", error: null });
});

// Handle login form submission
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const users = readUserData();
    const user = users.find(user => user.username === username);

    if (user) {
        bcrypt.compare(password, user.password).then(match => {
            if (match) {
                req.session.user = { username: username };
                res.redirect("/items");
            } else {
                res.render("login", { title: "Login", error: "Invalid credentials. Please try again." });
            }
        }).catch(err => {
            res.render("login", { title: "Login", error: "An error occurred. Please try again." });
        });
    } else {
        res.render("login", { title: "Login", error: "Invalid credentials. Please try again." });
    }
});

// Handle registration form submission
app.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (username && password.length >= 8) {
        const users = readUserData();

        if (users.find(user => user.username === username)) {
            res.render("register", { title: "Register", error: "Username already exists. Please choose another one." });
        } else {
            bcrypt.hash(password, 10).then(hashedPassword => {
                users.push({ username: username, password: hashedPassword });
                writeUserData(users);
                res.redirect("/login");
            }).catch(err => {
                res.render("register", { title: "Register", error: "An error occurred. Please try again." });
            });
        }
    } else {
        res.render("register", { title: "Register", error: "Please provide a username and password with at least 8 characters." });
    }
});

// Handle logout
app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
});

// Initialize store service and add routes for data queries
storeService.initialize().then(() => {
    app.get('/shop', (req, res) => {
        const category = req.query.category;
        if (category) {
            storeService.getPublishedItemsByCategory(category)
                .then(data => res.render("shop", { data: { items: data }, title: "Shop", viewingCategory: category }))
                .catch(err => res.render("shop", { data: { message: "No items found." }, title: "Shop" }));
        } else {
            storeService.getPublishedItems()
                .then(data => res.render("shop", { data: { items: data }, title: "Shop" }))
                .catch(err => res.render("shop", { data: { message: "No items found." }, title: "Shop" }));
        }
    });

    app.get("/items", ensureLogin, (req, res) => {
        if (req.query.category) {
            storeService.getItemsByCategory(req.query.category)
                .then(data => {
                    res.render("items", {
                        items: data,
                        title: "Items by Category",
                        user: req.session.user,
                        message: data.length > 0 ? null : "No results found"
                    });
                })
                .catch(err => {
                    res.render("items", {
                        items: [],
                        title: "Items by Category",
                        user: req.session.user,
                        message: "No results found"
                    });
                });
        } else if (req.query.minDate) {
            storeService.getItemsByMinDate(req.query.minDate)
                .then(data => {
                    res.render("items", {
                        items: data,
                        title: "Items by Date",
                        user: req.session.user,
                        message: data.length > 0 ? null : "No results found"
                    });
                })
                .catch(err => {
                    res.render("items", {
                        items: [],
                        title: "Items by Date",
                        user: req.session.user,
                        message: "No results found"
                    });
                });
        } else {
            storeService.getAllItems()
                .then(data => {
                    res.render("items", {
                        items: data,
                        title: "All Items",
                        user: req.session.user,
                        message: data.length > 0 ? null : "No results found"
                    });
                })
                .catch(err => {
                    res.render("items", {
                        items: [],
                        title: "All Items",
                        user: req.session.user,
                        message: "No results found"
                    });
                });
        }
    });
    

    app.get("/categories", ensureLogin, (req, res) => {
        storeService.getCategories()
            .then(data => {
                res.render("categories", {
                    categories: data,
                    title: "Categories",
                    message: data.length > 0 ? null : "No categories found."
                });
            })
            .catch(err => {
                res.status(500).render("categories", {
                    categories: [],
                    title: "Categories",
                    message: "Unable to load categories."
                });
            });
    });
    
    app.get("/item/:id", ensureLogin, (req, res) => {
        storeService.getItemById(req.params.id)
            .then(data => res.render("item", { item: data, title: "Item Details" }))
            .catch(err => res.status(500).render("item", { message: "Unable to load item details." }));
    });

    // 404 error page rendering
    app.use((req, res) => {
        res.status(404).render("404", { title: "Page Not Found" });
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Express http server listening on port ${PORT}`);
    });
}).catch(err => {
    console.error(`Could not open file: ${err}`);
});

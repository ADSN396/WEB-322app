/*********************************************************************************

WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: _ADSON DAVIS_____________________ 
Student ID: __164876229____________ 
Date: __11-03-2024______________
Cyclic Web App URL: _______________________________________________________
GitHub Repository URL: ______________________________________________________

********************************************************************************/ 

const express = require("express");
const path = require("path");
const storeService = require("./store-service"); 

const app = express();
const PORT = 8080;


storeService.initialize()
    .then(() => {
        
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        
        console.error("Unable to start the server. Error: ", err);
    });


app.get("/shop", (req, res) => {
    storeService.getPublishedItems()
        .then((data) => {
            res.json(data); 
        })
        .catch((err) => {
            res.status(500).json({ message: err }); 
        });
});


app.get("/items", (req, res) => {
    storeService.getAllItems()
        .then((data) => {
            res.json(data); 
        })
        .catch((err) => {
            res.status(500).json({ message: err }); 
        });
});

app.get("/categories", (req, res) => {
    storeService.getCategories()
        .then((data) => {
            res.json(data); 
        })
        .catch((err) => {
            res.status(500).json({ message: err }); 
        });
});


app.use((req, res) => {
    res.status(404).json({ message: "Page Not Found" }); 
});

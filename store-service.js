const fs = require("fs");
const path = require("path");

let items = [];
let categories = [];

function initialize() {
    return new Promise((resolve, reject) => {
        const itemsFilePath = path.join(__dirname, "data", "items.json");
        const categoriesFilePath = path.join(__dirname, "data", "categories.json");

        fs.readFile(itemsFilePath, "utf8", (err, data) => {
            if (err) {
                return reject(`Unable to read items.json: ${err.message}`);  
            }
            try {
                items = JSON.parse(data);
            } catch (e) {
                return reject(`Error parsing items.json: ${e.message}`);  
            }

            fs.readFile(categoriesFilePath, "utf8", (err, data) => {
                if (err) {
                    return reject(`Unable to read categories.json: ${err.message}`);  
                }
                try {
                    categories = JSON.parse(data);
                    resolve();  
                } catch (e) {
                    return reject(`Error parsing categories.json: ${e.message}`);  
                }
            });
        });
    });
}

function getAllItems() {
    return new Promise((resolve, reject) => {
        if (items.length > 0) {
            resolve(items);
        } else {
            reject("No results returned");
        }
    });
}

function getPublishedItems() {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published === true);
        if (publishedItems.length > 0) {
            resolve(publishedItems);
        } else {
            reject("No results returned");
        }
    });
}

function getCategories() {
    return new Promise((resolve, reject) => {
        if (categories.length > 0) {
            resolve(categories);
        } else {
            reject("No results returned");
        }
    });
}
    
module.exports = {
    initialize,
    getAllItems,
    getPublishedItems,
    getCategories
};

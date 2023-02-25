const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const lodash = require("lodash");
// const date = require(__dirname + "/date.js");
require('dotenv').config();

const app = express();

mongoose.set("strictQuery", false);

const uri = "mongodb+srv://" + process.env.DB_USER + ":" + process.env.DB_CRED + "@cluster0.wm2v0qx.mongodb.net/todolistDB";

mongoose.connect(uri);

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todo list!"
});

const item2 = new Item({
    name: "Hit + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    listItems: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.set("view engine", "ejs");

app.get("/", function (req, res) {
    var title = "Today";

    Item.find({}, function (err, results) {

        if (results.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                }
            });
            res.redirect("/");
        } else {
            res.render("list", { listHeading: title, listItems: results, buttonValue: "" });
        }
    });
});

app.post("/", function (req, res) {
    var x = req.body.newItem;
    var buttonValue = req.body.button;
    const newItem = new Item({
        name: x
    });
    if (buttonValue === "") {
        newItem.save(function (err) {
            if (err) {
                console.log(err);
            } else {
                res.redirect("/");
            }
        });
    } else {
        var listItemArray;
        List.findOne({ name: buttonValue }, function (err, resList) {
            if (err) {
                console.log(err);
                return;
            }
            listItemArray = resList.listItems;
            listItemArray.push(newItem);
            List.updateOne({ name: buttonValue }, { $set: { listItems: listItemArray } }, function (err) {
                if (err) {
                    console.log(err);
                }
            });
        });
        res.redirect("/" + buttonValue);
    }
});

app.get("/:customList", function (req, res) {
    const customList = lodash.startCase(req.params.customList);
    List.findOne({ name: customList }, function (err, results) {
        if (!results) {
            const list = new List({
                name: customList,
                listItems: defaultItems
            });
            list.save(function (err) {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect("/" + customList);
                }
            });
        } else {
            const title = customList;
            res.render("list", { listHeading: title, listItems: results.listItems, buttonValue: customList });
        }
    });
});

app.get("/about", function (req, res) {
    res.render("about");
});

function deleteFrom(srcArray, item) {
    var outArray = [];
    var id = "";
    for (var i = 0; i < srcArray.length; ++i) {
        id = "" + srcArray[i]._id + "";
        if (id !== item) {
            outArray.push(srcArray[i]);
        }
    }
    return outArray;
}

app.post("/delete", function (req, res) {
    if (req.body.length !== 0) {
        const itemId = req.body.check;
        const checkedList = req.body.checkList;
        if (checkedList === "Today") {
            Item.deleteOne({ _id: itemId }, function (err) {
                if (err) console.log(err);
                else res.redirect("/");
            });
        } else {
            var listItemArray;
            List.findOne({ name: checkedList }, function (err, resList) {
                if (err) {
                    console.log(err);
                    return;
                }
                listItemArray = resList.listItems;
                listItemArray = deleteFrom(listItemArray, itemId);
                List.updateOne({ name: checkedList }, { $set: { listItems: listItemArray } }, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
            });
            res.redirect("/" + checkedList);
        }
    }
});

let port = process.env.PORT;
if (port) {
    app.listen(port, function () {
        console.log("Server is online at port : " + port);
    });
} else {
    app.listen(3000, function () {
        console.log("Server is online at port : 3000");
    });
}


// database connections
const mongoose = require("mongoose");
const uri = process.env.MONGO_URI;
console.log(uri);
// const uri = 'mongodb://localhost/Medical';
mongoose.connect(uri, {
    useNewUrlParser: true, useUnifiedTopology: true
}).then((data) => {
    console.log("DB is connected..");
}).catch((err) => {
    console.log(err);
});
const connection = mongoose.connection;
connection.once("open", () => {
    console.log("Database connected sucessfully");
})
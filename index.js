const express = require('express');
const bodyParser = require('body-parser');
const route = require("./src/routes/route");
const { default: mongoose } = require('mongoose');
const app = express();

app.use(bodyParser.json()); 
// app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb+srv://shardulschatufale:shardul1234@cluster0.w686kdy.mongodb.net/TestDatabase?retryWrites=true", {
    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )

app.use('/', route);

app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});
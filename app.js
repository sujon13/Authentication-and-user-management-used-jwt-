const express = require('express');
const app = express();

// common middlewire
app.use(express.json());


// import routes
const authRoute = require('./routes/auth');
app.use('/api/v1/auth', authRoute);


// connect db
const mongoose = require('mongoose');
require('dotenv/config');

mongoose.connect(
    process.env.DB_CONNECTION,
    { 
        useNewUrlParser: true
    },
    () => {
        console.log('connected to auth database');
    }
)

app.listen(3000, () => console.log(`auth server is up and runing`));

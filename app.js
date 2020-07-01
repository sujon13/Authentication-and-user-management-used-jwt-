const express = require('express');
const app = express();

// common middlewire
app.use(express.json());


// import routes
const authRoute = require('./routes/auth');
app.use('/api/v1/auth', authRoute);

// swagger documentation route
const swaggerUi = require('swagger-ui-express');
const openApiDocumentation = require('./openApiDocumentation');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocumentation));


// connect db
const mongoose = require('mongoose');
require('dotenv/config');
// for mongoose 
mongoose.set('useFindAndModify', false);

mongoose.connect(
    process.env.DB_CONNECTION,
    { 
        useNewUrlParser: true,
        useUnifiedTopology: true 
    },
    () => {
        console.log('connected to auth database');
    }
)

app.listen(3000, () => console.log(`auth server is up and running`));

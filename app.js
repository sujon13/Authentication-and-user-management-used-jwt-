const express = require("express");
const app = express();
const createError = require("http-errors");

// common middlewire
app.use(express.json());

// import routes
const authRoute = require("./routes/auth");
app.use("/api/v1/auth", authRoute);
const accountRoute = require("./routes/users");
app.use("/api/v1/users", accountRoute);

// swagger documentation route

const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  console.error(`statusCode: ${err.statusCode}`);
  console.error(`message: ${err.message}`);
  console.error(`stack: ${err.stack}`);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  if (err.statusCode && err.statusCode != 500) {
    res.status(err.statusCode).send(err.message);
  } else {
    res.status(500).send("Internal server error");
  }
});

// connect db
const mongoose = require("mongoose");
require("dotenv/config");
// for mongoose
mongoose.set("useFindAndModify", false);

mongoose.connect(
  process.env.DB_CONNECTION,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {
    console.log("connected to auth database");
  }
);

app.listen(3000, () =>
  console.log(`auth server is up and running at port 3000`)
);

"use strict";
require("reflect-metadata");
const express = require("express");
const bodyParser = require("body-parser");
const routes_1 = require("./routes");
const fileUpload = require('express-fileupload');
const logger = require("./util/logger");
const session = require("express-session");
const http = require("http");
const socket_1 = require("./socket");
const cors = require('cors');
const { createConnection } = require("typeorm");

const app = express();
const corsOptions = {
  origin: 'http://localhost:8080',
};
app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: '512mb', extended: true }));
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload({ limits: { fileSize: 200 * 1024 * 1024 } }));

app.use(session({
  secret: 'ihjJG:xI?DYYI-AFfE.$XV$F)Aj~Z>=HW!<H/(i#Li)RAFAq!:WZ*cnb$UN-bUeZh?>dVwvVCLX^KwBAAJkfQmgvalHy-R$WSm<Y-:H#(^uh~%Xht>ApCeuFqCMJJ^pU',
  resave: false,
  rolling: true,
  saveUninitialized: false,
  cookie: { maxAge: 7200 * 1000 }
}));

createConnection({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "123456",
  database: "test",
  synchronize: true,
  logging: false,
  entities: [
    "entity/**/*.js"
  ],
}).then(connection => {
  const server = http.createServer(app);
  const io = require('socket.io')(server);
  const sockets = new socket_1.default(io);

  routes_1.Routes.forEach(route => {
    app[route.method](route.route, (req, res, next) => {
      const notCheckAction = ["UserLogin", "alreadyLogin", "UserLogout"];
      const result = (new route.controller)[route.action](req, res, next, sockets);
      if (route.route !== "/License/DMI") {
        if (result instanceof Promise) {
          result.then(result => result !== null && result !== undefined ? res.json(result) : res.status(404).send("undefined")).catch(error => { res.status(404).json(error); });
        }
        else if (result !== null && result !== undefined) {
          res.json(result);
        }
      }
    });
  });

  server.listen(8081, () => {
    logger.info(`Express server has started on port 8081.`);
  });
}).catch(error => {
  logger.error(error);
});

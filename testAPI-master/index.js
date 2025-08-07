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
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const corsOptions = {
  origin: 'http://localhost:8080',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
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

  app.use('/instances', createProxyMiddleware({
  target: 'http://127.0.0.1:8042',
  changeOrigin: true,
  pathRewrite: { '^/instances': '/instances' },
  proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
    proxyReqOpts.headers['Authorization'] = 'Basic ' + Buffer.from('orthanc:orthanc').toString('base64');
    return proxyReqOpts;
  },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('Access-Control-Allow-Origin', '*');
    proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    proxyReq.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    console.log('代理請求：', req.method, req.url);
  }
}));

  server.listen(8081, () => {
    logger.info(`Express server has started on port 8081.`);
  });
}).catch(error => {
  logger.error(error);
});
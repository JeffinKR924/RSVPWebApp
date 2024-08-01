const express = require('express');
const app = express();
const path = require('path');

let hostname = "localhost";
let port = 3000;

app.use(express.static(path.join(__dirname, '/')));

app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});
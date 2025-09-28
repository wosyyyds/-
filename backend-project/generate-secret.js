// generate-secret.js
const crypto = require('crypto');
console.log('JWT_SECRET=' + crypto.randomBytes(64).toString('hex'));

// JWT_SECRET=e4beebae328fd0e49ece1bb2122ac564be2a25189f64b87378a3930fc6ba7a628ae9e76b6413a6086705a350629eeeac967e0cd45d246f5550cd2d79fd6d9ac8

// JWT_SECRET=a794a08605c6a533839261d8e9a659616cbb3d708bed82502b5d7f597d4f2e7005c8fdbe63af9ea7c39226279a03b4ef4029b1c6f1cd8c14ad4503118fcc72d1
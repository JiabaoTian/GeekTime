const http = require('http');
http.createServer(function (request, response) {
  let body = [];
  request.on('error',err => {
    console.log(err);
  }).on('data', chunk => {
    console.log(1);
    console.log(chunk);
    // body.push(chunk);
    body.push(chunk.toString());
  }).on('end', () => {
    // body = Buffer.concat(body).toString();
    body = body.join('');
    console.log('body', body);
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end(
      `<html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <title>Document</title>
      </head>
      <style>
        body #main{
          background-color: red;
          width: 100px;
          height: 100px;
        }
        
      </style>
      <body>
        <div id='main'></div>
        <img src='#' />
      </body>
      </html>`);
  })

}).listen(8088);

console.log('server started');
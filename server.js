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
    response.end('Hello World \n');
  })

}).listen(8088);

console.log('server started');
if (process.getuid() > 0) {
  throw new Error("Plese run as root");
}
var child = process.createChildProcess("ngrep", ["-d", "en1", "port", "80"]);
process.setuid(501);

process.mixin(require('sys'));
var http = require('http');
var sys = require('sys');
var file = require('file');
var queue = [];
var waiting;

child.addListener("output", function (data) {
  queue.push(data);
  check_flush();
});

function check_flush() {
  if (waiting && queue.length > 0) {
    waiting.sendHeader(200, {'Content-Type': 'text/plain'});
    queue.forEach(function (data) {
      waiting.sendBody(data);
    });
    queue.length = 0;
    waiting.finish();
    waiting = null;
  }
}

http.createServer(function (req, res) {
  puts(req.url);
  switch (req.url) {
    case "/":
      puts("Serving html");
      file.read('page.html').addCallback(function (html) {
        res.sendHeader(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.sendBody(html);
        res.finish();
      });

    break;
    case "/poll":
      puts("Poll...");
      waiting = res;
    break;
    default:
      puts("404 " + req.url);
      res.sendHeader(404, {'Content-Type': 'text/plain'});
      res.sendBody("Not Found");
      res.finish();
    break;
  }
}).listen(5555);
puts("Server running on http://localhost:5555");
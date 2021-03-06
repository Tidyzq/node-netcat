'use strict';

var test = require('tape');
var Netcat = require('../');

var server;
var client;

test('nc server constructor - dont pass any param', function(assert) {
  assert.plan(1);

  try {
    server = Netcat.server();
  } catch(ex) {
    assert.ok(ex, ex);
  }
});

test('nc server constructor - pass only port & options', function(assert) { 
  server = Netcat.server(4000, {
    readEncoding: 'utf8',
    timeout: 3000
  });
  
  assert.ok(server);
  server.listen();

  server.once('ready', function() { 
    assert.pass('server, ready'); 
    server.close(function() {
      assert.pass('server closed');
      assert.end();
    });
  });  
});

test('tx to a client has disconnected', function(assert) {
  var clients;
  server = Netcat.server(4000);
  client = Netcat.client(4000);

  assert.ok(server);
  assert.ok(client);

  server.listen();

  server.once('ready', function() { 
    assert.pass('server, ready');
    client.start();
  });

  server.on('client_on', function(client) { 
    assert.ok(client, 'server, client connect ' + client);
    clients = server.getClients();
    assert.equal(clients.length, 1);
    assert.equal(clients[0], client); 
  });

  server.on('client_off', function(client) { 
    assert.ok(client, 'server, client disconnet ' + client);
  });

  server.on('client_error', function(err, client, chunk) {
    console.log(err, client, chunk);
  });

  server.once('error', assert.fail);
  

  server.once('close', function() {
    assert.pass('server, closed');
    assert.end();
  });

  client.once('open', function() {
    assert.pass('client, ready');
    client.close();
    server.send(client, 'Hello World!', function() {
       
      //server.close();  
    });
  });
});
return;

test('server & client using binary data', function(t) {
  t.plan(15);
 
  server = Netcat.server(4000);
  client = Netcat.client(4000);

  server.once('ready', function() { 
    t.pass('server, ready');
    client.start();
  });

  server.on('data', function(client, data) {
    t.equal(data.length > 0, 
      true,
      'server, receive data: "' + data + '" from client ' + client);

    // test Buffer
    t.equal(Buffer.isBuffer(data),
      true,
      'server, is configure to rx as Buffer');

    var clients = server.getClients();
    t.ok(clients, 'server, exists ' + clients.length + ' client active');

    // first send some messages without closing the conn
    Object.keys(clients).forEach(function(client) {
      server.send(clients[client], data, function() {
        t.pass('server, send "' + data + '" to client ' + clients[client]);
      });
    });

    // send empty data
    Object.keys(clients).forEach(function(client) {
      server.send(clients[client], '', function() {
        t.pass('server, send "' + data + '" to client ' + clients[client]);
      });
    });

    // now close the conn after tx the message
    Object.keys(clients).forEach(function(client) {
      server.send(clients[client], data, true, function() {
        t.pass('server, send "' + data + '" to client ' + clients[client]);
      });
    });

    setTimeout(function() { server.close(); }, 1000);
  });

  server.on('client_on', function(client) { 
    t.ok(client, 'server, client connect ' + client); 
  });

  server.on('client_off', function(client) { 
    t.ok(client, 'server, client disconnet ' + client); 
  });

  server.once('error', function(err) { t.error(err !== null, err); });
  server.once('close', function() { t.pass('server, closed'); });
  server.listen();

  // client
  client.once('open', function() { 
    t.pass('client, connected'); 
    setTimeout(function () {
      client.send('Hello World', function() {
        t.pass('client, send message');
      });
    }, 100);
  });

  client.on('data', function(data) {
    t.equal(data.length > -1, true, 'client, receive data: ' + data);
    // test encoding
    t.equal(Buffer.isBuffer(data),
      true,
      'client, is configure to rx binary data');
  });

  client.once('close', function() {
    t.pass('client, closed');
  });
});

test('server & client using utf8 encoding', function(t) {
  t.plan(15);
 
  server = Netcat.server(4000, {readEncoding: 'utf8'});
  client = Netcat.client(4000, {readEncoding: 'utf8'});

  server.once('ready', function() { 
    t.pass('server, ready');
    client.start();
  });

  server.on('data', function(client, data) {
    t.equal(data.length > 0, 
      true,
      'server, receive data: "' + data + '" from client ' + client);

    // test Buffer
    t.equal(typeof data,
      'string',
      'server, is configure to rx string data');

    var clients = server.getClients();
    t.ok(clients, 'server, exists ' + clients.length + ' client active');

    // some something without passing the callback
    Object.keys(clients).forEach(function(client) {
      server.send(clients[client], data);
      t.pass('server, send "' + data + '" to client ' + clients[client]);
    });
     
    // first send some messages without closing the conn
    Object.keys(clients).forEach(function(client) {
      server.send(clients[client], data, function() {
        t.pass('server, send "' + data + '" to client ' + clients[client]);
      });
    });

    // now close the conn after tx the message
    Object.keys(clients).forEach(function(client) {
      server.send(clients[client], data, true, function() {
        t.pass('server, send "' + data + '" to client ' + clients[client]);
      });
    });

    setTimeout(function() { server.close(); }, 1000);
  });

  server.on('client_on', function(client) { 
    t.ok(client, 'server, client connect ' + client); 
  });

  server.on('client_off', function(client) { 
    t.ok(client, 'server, client disconnet ' + client); 
  });

  server.once('error', function(err) { t.error(err !== null, err); });
  server.once('close', function() { t.pass('server, closed'); });
  server.listen();


  // client
  client.once('open', function() { 
    t.pass('client, connected'); 
    setTimeout(function () {
      client.send('Hello World', function() {
        t.pass('client, send message');
      });
    }, 100);
  });

  client.on('data', function(data) {
    t.equal(data.length > -1, true, 'client, receive data: ' + data);
    // test encoding
    t.equal(typeof data,
      'string',
      'client, is configure to rx string data');
  });

  client.once('close', function() {
    t.pass('client, closed');
  });
});


test('portscan', function(t) {
  t.plan(4);// testing one with success and another with error

  var scan = Netcat.portscan();

  scan.run('google.com', '80-81', function(err, res) {
    // will fail in port 81
    if (err) return t.ok(err, err);

    t.ok(res, res);    
  });
});


test('upd', function(t) {
  t.plan(5);

  server = Netcat.udpServer(5000, '127.0.0.1');
  client = Netcat.udpClient(5000, '127.0.0.1');

  server.on('data', function(msg, client, protocol) {
    t.ok(msg,
      'server, "' + msg + '", ' + JSON.stringify(client) + ', ' + protocol);
    setTimeout(function() { server.close(); }, 1200);
  });

  server.on('ready', function() {
    t.pass('server, ready');

    setTimeout(function() {
      client.send('Hello World UDP!!!!');
      setTimeout(function() { client.close(); }, 1000);
    }, 1000);
  });
  
  server.once('error', function(err) { t.error(err !== null, err); });
  server.once('close', function() { t.pass('server, closed'); });
  server.bind();


  client.on('open', function() { t.pass('client, open'); });
  client.once('error', function(err) { t.error(err !== null, err); });
  client.once('close', function() { t.pass('client, closed'); });
});





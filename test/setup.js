var mockery = require('mockery');

var mockConfig = require('./mocks/config');
var mockHttp = require('./mocks/http');

mockery.enable();
mockery.warnOnUnregistered(false);

mockery.registerMock('./config', mockConfig);
mockery.registerMock('http', mockHttp);
mockery.registerMock('https', mockHttp);

after(function() {
  mockery.deregisterAll();
  mockery.disable();
});
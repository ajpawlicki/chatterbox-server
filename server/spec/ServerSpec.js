var handler = require('../request-handler');
var expect = require('chai').expect;
var stubs = require('./Stubs');

// Conditional async testing, akin to Jasmine's waitsFor()
// Will wait for test to be truthy before executing callback
var waitForThen = function (test, cb) {
  setTimeout(function() {
    test() ? cb.apply(this) : waitForThen(test, cb);
  }, 5);
};

describe('Node Server Request Listener Function', function() {
  it('Should answer GET requests for /classes/messages with a 200 status code', function() {
    // This is a fake server request. Normally, the server would provide this,
    // but we want to test our function's behavior totally independent of the server code
    var req = new stubs.request('/classes/messages', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    expect(res._responseCode).to.equal(200);
    expect(res._ended).to.equal(true);
  });

  it('Should send back parsable stringified JSON', function() {
    var req = new stubs.request('/classes/messages', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    expect(JSON.parse.bind(this, res._data)).to.not.throw();
    expect(res._ended).to.equal(true);
  });

  it('Should send back an object', function() {
    var req = new stubs.request('/classes/messages', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    var parsedBody = JSON.parse(res._data);
    expect(parsedBody).to.be.an('object');
    expect(res._ended).to.equal(true);
  });

  it('Should send an object containing a `results` array', function() {
    var req = new stubs.request('/classes/messages', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    var parsedBody = JSON.parse(res._data);
    expect(parsedBody).to.have.property('results');
    expect(parsedBody.results).to.be.an('array');
    expect(res._ended).to.equal(true);
  });

  it('Should accept posts to /classes/room', function() {
    var stubMsg = {
      username: 'Jono',
      message: 'Do my bidding!'
    };
    var req = new stubs.request('/classes/messages', 'POST', stubMsg);
    var res = new stubs.response();

    handler.requestHandler(req, res);

    // Expect 201 Created response status
    expect(res._responseCode).to.equal(201);

    // Testing for a newline isn't a valid test
    // TODO: Replace with with a valid test
    // expect(res._data).to.equal(JSON.stringify('\n'));
    expect(res._ended).to.equal(true);
  });

  it('Should respond with messages that were previously posted', function() {
    var stubMsg = {
      username: 'Jono',
      message: 'Do my bidding!'
    };
    var req = new stubs.request('/classes/messages', 'POST', stubMsg);
    var res = new stubs.response();

    handler.requestHandler(req, res);

    expect(res._responseCode).to.equal(201);

      // Now if we request the log for that room the message we posted should be there:
    req = new stubs.request('/classes/messages', 'GET');
    res = new stubs.response();

    handler.requestHandler(req, res);

    expect(res._responseCode).to.equal(200);
    var messages = JSON.parse(res._data).results;
    expect(messages.length).to.be.above(0);
    expect(messages[0].username).to.equal('Jono');
    expect(messages[0].message).to.equal('Do my bidding!');
    expect(res._ended).to.equal(true);
  });


  it('Should 404 when asked for a nonexistent file', function() {
    var req = new stubs.request('/arglebargle', 'GET');
    var res = new stubs.response();

    handler.requestHandler(req, res);

    // Wait for response to return and then check status code
    waitForThen(
      function() { return res._ended; },
      function() {
        expect(res._responseCode).to.equal(404);
      });
  });

  describe('Tests that we made', function() {
    it('should have all messages in sequence at which they are created', function() {
      var stubMsg = {
        username: 'Jono',
        message: 'Do my bidding!'
      };
      var stubMsg2 = {
        username: 'Hono',
        message: 'Do my bedding!'
      };
      var req = new stubs.request('/classes/messages', 'POST', stubMsg);
      var res = new stubs.response();
      handler.requestHandler(req, res);

      var req2 = new stubs.request('/classes/messages', 'POST', stubMsg2);
      var res2 = new stubs.response();
      handler.requestHandler(req2, res2);

      var req3 = new stubs.request('/classes/messages', 'GET');
      var res3 = new stubs.response();

      handler.requestHandler(req3, res3);

      var messages = JSON.parse(res3._data).results;
      expect(messages[2].message).to.equal('Do my bidding!');
      expect(messages[3].message).to.equal('Do my bedding!');    
      // console.log(messages[1]);
    });  

    it('should have a roomname in message object', function() {
      var stubMsg = {
        username: 'Jono',
        message: 'Do my bidding!',
        roomname: 'restroom'
      };      
      var req = new stubs.request('/classes/messages', 'POST', stubMsg);
      var res = new stubs.response();
      handler.requestHandler(req, res);
      var req3 = new stubs.request('/classes/messages', 'GET');
      var res3 = new stubs.response();
      handler.requestHandler(req3, res3);
      var messages = JSON.parse(res3._data).results;
      expect(messages[4].roomname).to.equal('restroom');            
    });

  });
});

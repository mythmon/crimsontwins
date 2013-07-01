function setup(app, screenManager) {
  app.get('/api/ping', function(req, res) {
    res.status(200);
    res.end('pong');
  });

  app.post('/api/reset', function(req, res) {
    var screenName = req.query.screen || undefined;

    screenManager.reset(screenName);

    res.status(204);
    res.end();
  });

  app.post('/api/sendurl', function(req, res) {
    var p;
    var url = req.query.url;
    var screenName = req.query.screen;

    if (!url) {
      res.json(400, {error: 'URL is required.'});
      return;
    }

    p = screenManager.sendUrl(url, screenName);
    p.then(
      function(obj) {
        res.json(200, obj);
      },
      function(obj) {
        var status = obj.error || 500;
        res.json(status, obj);
      }
    );
  });

  app.get('/api/config', function(req, res) {
    res.end(JSON.stringify(config, null, true));
  });

  app.get('/api/staticpath', function(req, res) {
    res.end(path.normalize(__dirname + '/../static'));
  });

  app.get('/api/env', function(req, res) {
    res.end(JSON.stringify(process.env));
  });
}

exports.setup = setup;

'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var fmt = require('@segment/fmt');
var Walkme = require('../lib');

describe('WalkMe', function () {
  var analytics;
  var walkme;
  var options = {
    walkmeGuid: 'E011E9F84AD84D819286A5A94BAF2255',
    walkmeEnv: 'test',
    walkmeLoadInIframe: true
  };

  beforeEach(function () {
    analytics = new Analytics();
    walkme = new Walkme(options);
    analytics.use(Walkme);
    analytics.use(tester);
    analytics.add(walkme);
  });

  afterEach(function () {
    analytics.restore();
    analytics.reset();
    walkme.reset();
    sandbox();
  });

  it('should have the correct settings', function () {
    analytics.compare(
      Walkme,
      integration('WalkMe')
        .assumesPageview()
        .option('walkmeGuid', '')
        .option('walkmeEnv', '')
    );
  });

  describe('before loading', function () {
    beforeEach(function () {
      analytics.stub(walkme, 'load');
    });

    describe('#initialize', function () {
      it('it should set global WalkMe options', function () {
        analytics.assert(!window._walkmeConfig);
        analytics.initialize();
        analytics.page();
        analytics.deepEqual(window._walkmeConfig, { smartLoad: true });
      });
    });
  });

  describe('loading', function () {
    beforeEach(function () {
      analytics.spy(walkme, 'load');
    });

    it('should load walkme test lib', function (done) {
      try {
        analytics.load(walkme, function () {
          analytics.loaded(
            fmt(
              '<script src="https://cdn.walkme.com/users/%s/%s/walkme_%s_https.js"/>',
              options.walkmeGuid.toLowerCase(),
              'test',
              options.walkmeGuid.toLowerCase()
            )
          );

          analytics.assert(
            !!window.WalkMeAPI,
            'Expected WalkMeAPI to be present on the page'
          );

          done();
        });
      }
      catch (e) {
        done(e);
      }
    });
  });

  describe('after loading', function (done) {
    beforeEach(function (done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#identify', function () {
      beforeEach(function () {
        analytics.stub(window.WalkMeAPI, 'identify');
      });

      it('Should call WalkMe API when identify happens', function () {
        var expected = {
          userId: '112233',
          isAnonUser: false,
          traits: {
            id: '112233'
          }
        };

        analytics.identify(expected.userId);
        analytics.called(window.WalkMeAPI.identify);
        analytics.equal(expected.isAnonUser, false);
        analytics.equal(expected.userId, window._walkmeInternals.Segment.userId);
      });

      it('Should call WalkMe API with anonymous user', function () {
        var expected = {
          userId: 'user_id_example',
          isAnonUser: true,
          traits: {}
        };

        analytics.user().anonymousId(expected.userId);
        analytics.identify();
        analytics.called(window.WalkMeAPI.identify);
        analytics.equal(expected.userId, window._walkmeInternals.Segment.userId);
        analytics.equal(expected.isAnonUser, true);
        analytics.deepEqual(expected.traits, window._walkmeInternals.Segment.traits);
      });
    });
  });
});

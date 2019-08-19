'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var Identify = require('segmentio-facade').Identify;

/**
 * Expose `WalkMe`
 */

var WalkMe = module.exports = integration('WalkMe')
  .assumesPageview()
  .global('walkme')
  .option('walkMeSystemId', '')
  .option('walkMeEnvironment', '')
  .option('walkMeLoadInIframe', false)
  .tag('<script src="https://cdn.walkme.com/users/{{ walkMeSystemId }}{{ walkMeEnvironment }}/walkme_{{ walkMeSystemId }}_https.js">')

/**
 * Initialize WalkMe
 *
 * @param {Facade} page
 */

WalkMe.prototype.initialize = function () {
  window._walkmeConfig = { smartLoad: true };

  if (this.options.walkMeLoadInIframe) {
    window.walkme_load_in_iframe = true;
  }

  var env = "\/" + (this.options.walkMeEnvironment && this.options.walkMeEnvironment.toLowerCase());

  if (!env || env == "\/" || env == "\/production") {
    env = "";
  }

  var _this = this;
  var isSegmentSignalSent = false;
  window.walkme_segment_ready = function () {
    isSegmentSignalSent = true;
    _this.ready();
  };

  var oldWalkMeReady = window.walkme_ready;
  window.walkme_ready = function () {
    oldWalkMeReady && oldWalkMeReady();

    if (!isSegmentSignalSent) {
      _this.ready();
    }
  }

  this.load({
    walkMeSystemId: this.options.walkMeSystemId.toLowerCase(),
    walkMeEnvironment: env
  });
};

/**
 * Has the WalkMe library been loaded yet?
 *
 * @return {Boolean}
 */

WalkMe.prototype.loaded = function () {
  return window._walkmeInternals && window._walkmeInternals.Segment;
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

WalkMe.prototype.identify = function (data) {
  if (window.WalkMeAPI && window.WalkMeAPI.Segment && window.WalkMeAPI.Segment.identify) {
    window.WalkMeAPI.Segment.identify.apply(null, arguments);
  }
  else {
    window._walkmeInternals.Segment.preLoadedData = arguments;
  }
};

WalkMe.prototype.track = function () {
  window.WalkMeAPI && window.WalkMeAPI.Segment && window.WalkMeAPI.Segment.apply(null, arguments);
};

WalkMe.prototype.reset = function () {
  window._walkMe && window._walkMe.removeWalkMe && window._walkMe.removeWalkMe();
}

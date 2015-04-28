'use strict';

function debug(str) {
  console.log("MANU -> " + str);
}

debug('APP carga app.js');

(function() {
  // This is a very basic sample app that uses a SW and acts as a server for
  // navigator.connect. I'm going to mark with a comment where the app MUST
  // add some extra code to use the navigator.connect SHIM
  // So if you just want to know that, search for:
  // ADDED FOR SHIM


  var register = function(evt) {
    debug('APP executing register...');
    navigator.serviceWorker.register('/settings-sw/sw.js', {scope: './'}
    ).then(function(reg) {
      debug('APP Registration succeeded. Scope: ' + reg.scope);
      if (reg.installing) {
        debug('APP registration --> installing');
        // Reload document... (yep sucks!)
        // ADDED FOR SHIM: This is needed because the shim needs to have the
        // SW ready to work, and that does not happen the first time it's installed
        location.reload();
        // END ADDED FOR SHIM
      } else if (reg.waiting) {
        debug('APP registration --> waiting');
      } else if (reg.active) {
        debug('APP registration --> active');
        debug('APP setting client\'s msg handler');
      }
    }).catch(function(error) {
      debug('APP Registration failed with ' + error);
    });
  };

  var unregister = function(evt) {
    debug('APP Unregister...');
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(reg => {
        reg.unregister();
        debug('APP Unregister done');
      });
    });
  };

  var processSWRequest = function(channel, evt) {
    evt.channel = channel;
debug('processSWRequest APP');
    SettingsService.handleRequest(evt);
  };

  if ('serviceWorker' in navigator) {
    debug('APP serviceWorker in navigator');
    register();
    navigator.serviceWorker.ready.then(sw => {
      // Let's pass the SW some way to talk to us...
      var mc = new MessageChannel();
      mc.port1.onmessage = processSWRequest.bind(this, mc.port1);
      sw.active && sw.active.postMessage({}, [mc.port2]);
    });
  } else {
    debug('APP navigator has not ServiceWorker');
    return;
  }
})(self);

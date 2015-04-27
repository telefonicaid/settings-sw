'use strict';

// This is a very basic sample Service Worker (SW) that  acts as a server for
// navigator.connect. I'm going to mark with a comment where the app MUST
// add some extra code to use the navigator.connect SHIM
// So if you just want to know that, search for:
// ADDED FOR SHIM


function debug(str) {
  console.log('MANU -> ' + str);
}

// ADDED FOR SHIM: Import the shim script
this.importScripts("/settings-sw/shim/navigator_connect_shim_sw.js");
// END ADDED FOR SHIM

debug('SW importScripts executed (hopefully)!');

this.addEventListener('install', function(evt) {
  debug('SW Install event');
});

this.addEventListener('activate', function(evt) {
  debug('SW activate event');
});

this.addEventListener('fetch', function(evt) {
  debug('SW fetch event');
});

this.onconnect = function(msg) {
  debug("SW onconnect event");
  for(var i in msg){
    debug('SW --->' +i+':'+msg[i]);
  }
  debug("SW onconnect: We should have a port here on msg.source: " +
        JSON.stringify(msg.source));
  // msg.source should have the endpoint to send and receive messages,
  // so we can do:
  msg.acceptConnection(true);
  msg.source.onmessage = function(aMsg) {
    debug(JSON.stringify(aMsg));
    var msg = aMsg.data;
    if (!msg.type || !msg.name) {
      debug('Message received bad formed');
      return;
    }

    // We need to delegate this work to the app because SW does not have access
    // to the device APIs
    self.clients.matchAll().then(res => {
      if (!res.length) {
        debug('SW SETTING Error: no clients are currently controlled.');
      } else {
        debug('SW SETTING Sending...');
        res[0].postMessage(msg);
      }
    });
  };

  this.msgConnectionChannel = msg.source;
};

this.addEventListener('message', function(evt) {
  // This is a hack caused by the lack of dedicated MessageChannels... sorry!
  debug('SW onmessage ---> '+ JSON.stringify(evt.data));
  // ADDED FOR SHIM
  // Since we're using the same channel to process messages comming from the main
  // thread of the app to the SW, and messages coming from the navigator.connect
  // shim, we have to distinguish them here
  if (this.NCShim.isInternalMessage(evt)) {
    debug('SW es msg interno. no ejectuar esto');
    return;
  }
  // END ADDED FOR SHIM

  // Your code here
  debug("SW We got a message for us!");
  this.msgConnectionChannel.postMessage(evt.data);
});




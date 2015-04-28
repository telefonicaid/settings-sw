'use strict';

/* This service is used to offer settings to privileged apps. */
(function (exports) {
  function SettingsService() {
    this.mozSettings = window.navigator.mozSettings;
    this.handleSettingChange = this.onSettingChange.bind(this);
  }

  SettingsService.prototype = {
    _observers: [],

    handleRequest: function ss_handleRequest(msg) {
      if (this[msg.data.type]) {
        this[msg.data.type](msg);
      }
    },

    get: function ss_get(msg) {
      var lock = this.mozSettings.createLock();
      var request = lock.get(msg.data.name);

      request.onsuccess = function() {
        window.DUMP('Get setting value success: ' +
          request.result[msg.data.name]);
        this.respondRequest(msg, {
          type: 'get',
          name: msg.data.name,
          value: request.result[msg.data.name]
        });
      }.bind(this);

      request.onerror = function() {
        window.DUMP('Something went wrong');
        this.respondRequest(msg, {
          type: 'get',
          name: msg.data.name,
          value: false
        });
      }.bind(this);
    },

    set: function ss_set(msg) {
      if (typeof msg.data.value === 'undefined') {
        window.DUMP('Message received bad formed. Missing parameter: value');
        return;
      }

      var lock = this.mozSettings.createLock();
      var cset = {};
      cset[msg.data.name] = msg.data.value;
      var request = lock.set(cset);

      request.onsuccess = function() {
        window.DUMP('Update setting value success');
        this.respondRequest(msg, {
          type: 'set',
          name: msg.data.name,
          result: true
        });
      }.bind(this);

      request.onerror = function() {
        window.DUMP('Something went wrong');
        this.respondRequest(msg, {
          type: 'set',
          name: msg.data.name,
          result: false
        });
      }.bind(this);
    },

    observe: function ss_observe(msg) {
      console.info('MANU - ' + JSON.stringify(msg));
      if (!this.mozSettings) {
        window.setTimeout(function() {
          this.handleSettingChange(msg.data.defaultValue);
        });
        return;
      }

      var request = this.mozSettings.createLock().get(msg.data.name);

      request.onsuccess = function() {
        var value = typeof(request.result[msg.data.name]) != 'undefined' ?
          request.result[msg.data.name] : msg.data.defaultValue;
console.info('MANU - ' + value);
        this.handleSettingChange(msg.data.name, value);
      }.bind(this);

      var settingChanged = function settingChanged(evt) {
        this.handleSettingChange(msg, evt.settingValue);
      }.bind(this);
      this.mozSettings.addObserver(msg.data.name, settingChanged);
      this._observers.push({
        name: msg.data.settingKey,
        observer: settingChanged
      });
    },

    unobserve: function ss_unobserve(msg) {
      this._observers.forEach(function(value, index) {
        if (value.name === msg.data.name) {
          this.mozSettings.removeObserver(value.name, value.observer);
          this._observers.splice(index, 1);
        }
      }.bind(this));
    },

    onSettingChange: function ss_onSettingChange(msg, settingValue) {
      this.respondRequest(msg, {
        type: 'observe',
        name: msg.data.name,
        value: settingValue
      });
    },

    respondRequest: function ss_respondRequest(msg, response) {
      msg.channel.postMessage(response);
    }
  };

  exports.SettingsService = new SettingsService();
}(window));
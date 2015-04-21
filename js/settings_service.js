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
      if (this[msg.type]) {
        this[msg.type](msg);
      }
    },

    get: function ss_get(data) {
      var lock = this.mozSettings.createLock();
      var request = lock.get(data.name);

      request.onsuccess = function() {
        window.DUMP('Get setting value success: ' +
          request.result[data.name]);
        this.respondRequest({
          type: 'get',
          name: data.name,
          value: request.result[data.name]
        });
      }.bind(this);

      request.onerror = function() {
        window.DUMP('Something went wrong');
        this.respondRequest({
          type: 'get',
          name: data.name,
          value: false
        });
      }.bind(this);
    },

    set: function ss_set(data) {
      if (typeof data.value === 'undefined') {
        window.DUMP('Message received bad formed. Missing parameter: value');
        return;
      }

      var lock = this.mozSettings.createLock();
      var cset = {};
      cset[data.name] = data.value;
      var request = lock.set(cset);

      request.onsuccess = function() {
        window.DUMP('Update setting value success');
        this.respondRequest({
          type: 'set',
          name: data.name,
          result: true
        });
      }.bind(this);

      request.onerror = function() {
        window.DUMP('Something went wrong');
        this.respondRequest({
          type: 'set',
          name: data.name,
          result: false
        });
      }.bind(this);
    },

    observe: function ss_observe(data) {
      if (!this.mozSettings) {
        window.setTimeout(function() {
          this.handleSettingChange(data.defaultValue);
        });
        return;
      }

      var request = this.mozSettings.createLock().get(data.name);

      request.onsuccess = function() {
        var value = typeof(request.result[data.name]) != 'undefined' ?
          request.result[data.name] : data.defaultValue;
        this.handleSettingChange(data.name, value);
      }.bind(this);

      var settingChanged = function settingChanged(evt) {
        this.handleSettingChange(data.name, evt.settingValue);
      }.bind(this);
      this.mozSettings.addObserver(data.name, settingChanged);
      this._observers.push({
        name: data.settingKey,
        observer: settingChanged
      });
    },

    unobserve: function ss_unobserve(data) {
      this._observers.forEach(function(value, index) {
        if (value.name === data.name) {
          this.mozSettings.removeObserver(value.name, value.observer);
          this._observers.splice(index, 1);
        }
      }.bind(this));
    },

    onSettingChange: function ss_onSettingChange(settingKey, settingValue) {
      this.respondRequest({
        type: 'observe',
        name: settingKey,
        value: settingValue
      });
    },

    respondRequest: function ss_respondRequest(response) {
      navigator.serviceWorker.ready.then(sw => {
        sw.active && sw.active.postMessage(response);
      });
    }
  };

  exports.SettingsService = new SettingsService();
}(window));
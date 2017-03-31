'use strict';

const BPromise = require('bluebird');
const qmotion = require('qmotion');

class Qmotion {
  constructor() {
    this.devices = {};
    this.client = qmotion.search();

    this.client.on('found', device => this._addDevice(device));
  }

  _addDevice(device) {
    device.on('initialized', (items) => {
      this.devices[device.ip].blinds = Object.keys(items).reduce(
        (map, key) => Object.assign(map, { [items[key].name]: items[key] }),
        {},
      );
    });

    this.devices[device.ip] = {
      blinds: {},
      device,
    };
  }

  listDevices() {
    return Object.keys(this.devices);
  }

  listBlinds(deviceID) {
    if (!this.devices[deviceID]) {
      return undefined;
    }

    return Object.keys(this.devices[deviceID].blinds);
  }

  moveBlind({ deviceID, blindID, position }) {
    const blind = this.devices[deviceID] && this.devices[deviceID].blinds[blindID];

    return BPromise.fromCallback(cb => blind.move(position, cb));
  }
}

Qmotion.positions = {
  1: 0.0,
  2: 12.5,
  3: 25,
  4: 37.5,
  5: 50,
  6: 62.5,
  7: 75,
  8: 87.5,
  9: 100,
};

module.exports = Qmotion;

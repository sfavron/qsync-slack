'use strict';

const BPromise = require('bluebird');
const bunyan = require('bunyan');
const qmotion = require('qmotion');

class Qmotion {
  constructor({ log }) {
    if (log) {
      this.log = log.child({ component: 'qmotion' });
    } else {
      this.log = bunyan.createLogger({
        name: 'qmotion',
        streams: [],
      });
    }

    this.devices = {};

    this.client = qmotion.search();

    this.client.on('found', device => this._addDevice(device));
  }

  _addDevice(device) {
    this.log.debug({ device }, 'found device');

    device.on('initialized', (items) => {
      this.log.debug({ device: device.ip, items }, 'got items for device');
      this.devices[device.ip].blinds = Object.keys(items).reduce(
        (map, key) => Object.assign(map, { [items[key].name]: items[key] }),
        {}
      );
      this.log.debug({ devices: this.devices }, 'build devices');
    });

    device.on('blind', (item) => {
      this.log.debug({ device: device.ip, item }, 'got item for device');
      this.devices[device.ip].blinds[item.name] = item;
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
    this.log.debug({ deviceID, blindID, position }, 'move blind');
    const blind = this.devices && this.devices[deviceID] && this.devices[deviceID].blinds[blindID];

    if (!blind) {
      this.log.warn({ deviceID, blindID, position }, 'couldn\'t find blind');
      return;
    }

    const pos = Qmotion.positions[position];

    if (pos === undefined) {
      this.log.warn({ deviceID, blindID, position }, 'invalid position');
      return;
    }

    blind.move(pos, newPos => this.log.debug({ deviceID, blindID, newPos }, 'move success'));
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

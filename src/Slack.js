'use strict';

const BPromise = require('bluebird');
const RtmClient = require('@slack/client').RtmClient;
const RTM_CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;

class Slack {
  constructor({ token }) {
    this.client = new RtmClient(token);
  }

  initialize() {
    const connOpen = BPromise.fromCallback(
      cb => this.client.on(RTM_CLIENT_EVENTS.RTM_CONNECTION_OPENED, cb),
    );

    this.client.on(RTM_EVENTS.MESSAGE, message => this._receiveMessage(message));

    return connOpen;
  }

  _receiveMessage(message) {

  }
}

module.exports = Slack;

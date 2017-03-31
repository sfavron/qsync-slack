'use strict';

const bunyan = require('bunyan');
const SlackBot = require('slackbots');

function parseCommand(text) {
  const regex = /[^\s"]+|"([^"]*)"/gi;
  const parsed = {
    cmd: '',
    args: [],
  };

  let match;
  do {
    match = regex.exec(text);
    if (match) {
      parsed.args.push(match[1] ? match[1] : match[0]);
    }
  } while (match);

  if (parsed.args.length === 0) {
    return undefined;
  }

  parsed.cmd = parsed.args.shift();

  return parsed;
}

function help(args) {
  let cmds;
  if (args && args.length === 1) {
    cmds = [args.shift()];
  } else {
    cmds = ['move', 'devices', 'blinds', 'help'];
  }

  return cmds.reduce((str, cmd) => {
    let text;
    switch (cmd) {
      case 'move':
        text = `
move [deviceID] blindID position

Moves a specified blind to a given position.
**deviceID** only needs to be specified if there is more than one device on your network. Default will use the first device found.

Valid positions:
1:   0.0%
2:  12.5%
3:  25.0%
4:  37.5%
5:  50.0%
6:  62.5%
7:  75.0%
8:  87.5%
9: 100.0%`;
        break;

      case 'devices':
        text = `
devices

Lists available devices on the network.`;
        break;

      case 'blinds':
        text = `
blinds [deviceID]

Lists available blinds

**deviceID**: if specified, will only return blinds connected to this device`;
        break;

      case 'help':
        text = `
help [command]

Shows this help message.

**command**: if specified, shows help only for the specified command`;
        break;

      default:
        text = 'unrecognized command';
        break;
    }

    return `${str}${text}\n`;
  }, '');
}

class Slack {
  constructor({ token, qmotion, log }) {
    this.bot = new SlackBot({
      token,
      name: 'BlindsBot',
    });
    this.qmotion = qmotion;

    if (log) {
      this.log = log.child({ component: 'slack' });
    } else {
      this.log = bunyan.createLogger({
        name: 'slack',
        streams: [],
      });
    }

    this.bot.on('message', data => this._handleMessage(data));
  }

  _handleMessage(data) {
    if (data.type !== 'message' || data.subtype || data.hidden) {
      return;
    }

    this.log.debug({ data }, 'got message');

    const cmd = parseCommand(data.text);
    if (!cmd) {
      return;
    }

    this.log.info({ cmd }, 'parsed command');

    let resp;
    switch (cmd.cmd) {
      case 'move':
        resp = this.move(cmd.args);
        break;

      case 'blinds':
        resp = this.blinds(cmd.args);
        break;

      case 'devices':
        resp = this.devices();
        break;

      case 'help':
        resp = help(cmd.args);
        break;

      default:
        resp = 'unrecognized command';
        break;
    }

    if (resp) {
      this.bot.postMessage(data.channel, resp);
    }
  }

  move(args) {
    if (!args || args.length < 2 || args.length > 3) {
      return 'invalid arguments';
    }

    const moveArgs = {};
    if (args.length === 3) {
      moveArgs.deviceID = args.shift();
    } else {
      moveArgs.deviceID = this.qmotion.listDevices()[0];
    }

    moveArgs.blindID = args.shift();
    moveArgs.position = args.shift();

    this.qmotion.moveBlind(moveArgs);

    return undefined;
  }

  devices() {
    return this.qmotion.listDevices().join('\n');
  }

  blinds(args) {
    let devices;
    if (args && args.length === 1) {
      devices = [args.shift()];
    } else {
      devices = this.qmotion.listDevices();
    }

    return devices.reduce((str, device) => {
      const blinds = this.qmotion
        .listBlinds(device)
        .reduce((blindStr, blind) => `${blindStr}\t${blind}\n`, '');

      return `${str}${device}:\n${blinds}`;
    }, '');
  }
}

module.exports = Slack;

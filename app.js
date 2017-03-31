'use strict';

const bunyan = require('bunyan');

const Qmotion = require('./src/Qmotion');
const Slack = require('./src/Slack');

const log = bunyan.createLogger({
  name: 'qsync-slack',
  level: 'debug',
  serializers: bunyan.stdSerializers,
});

const bot = new Slack({
  token: process.env.SLACK_TOKEN || '',
  qmotion: new Qmotion({ log }),
  log,
});

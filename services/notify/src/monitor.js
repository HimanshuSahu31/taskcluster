const MonitorManager = require('taskcluster-lib-monitor');

const manager = new MonitorManager({
  serviceName: 'notify',
});

manager.register({
  name: 'email',
  title: 'Email Request',
  type: 'email',
  version: 1,
  level: 'info',
  description: 'A request to send an email.',
  fields: {
    address: 'The requested recepient of the email.',
  },
});

manager.register({
  name: 'pulse',
  title: 'Pulse Request',
  type: 'pulse',
  version: 1,
  level: 'info',
  description: 'A request to send a pulse message.',
  fields: {
    routingKey: 'The requested routingKey of the message.',
  },
});

manager.register({
  name: 'irc',
  title: 'IRC Message Request',
  type: 'irc',
  version: 1,
  level: 'info',
  description: 'A request to send an irc message.',
  fields: {
    dest: 'A user or channel. Will begin with "#" if a channel.',
  },
});

module.exports = manager;

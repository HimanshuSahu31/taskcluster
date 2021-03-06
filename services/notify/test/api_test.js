const assert = require('assert');
const helper = require('./helper');

helper.secrets.mockSuite(helper.suiteName(__filename), ['taskcluster', 'aws'], function(mock, skipping) {
  helper.withEntities(mock, skipping);
  helper.withPulse(mock, skipping);
  helper.withSES(mock, skipping);
  helper.withSQS(mock, skipping);
  helper.withServer(mock, skipping);

  // Dummy address for denylist tests
  let dummyAddress1 = {
    notificationType: "email",
    notificationAddress: "name1@name.com",
  };
  let dummyAddress2 = {
    notificationType: "irc-user",
    notificationAddress: "username",
  };

  test('ping', async function() {
    await helper.apiClient.ping();
  });

  test('pulse', async function() {
    await helper.apiClient.pulse({routingKey: 'notify-test', message: {test: 123}});
    helper.checkNextMessage('notification', m => {
      assert.deepEqual(m.payload.message, {test: 123});
      assert.deepEqual(m.CCs, ['route.notify-test']);
    });
  });

  test('does not send notifications to denylisted pulse address', async function() {
    // Add an address to the denylist
    await helper.apiClient.addDenylistAddress({
      notificationType: 'pulse',
      notificationAddress: 'notify-test',
    });
    // Ensure sending notification to that address fails with appropriate error
    try {
      await helper.apiClient.pulse({routingKey: 'notify-test', message: {test: 123}});
    } catch(e) {
      assert(e.code, 'DenylistedAddress');
    }
  });

  test('email', async function() {
    await helper.apiClient.email({
      address: 'success@simulator.amazonses.com',
      subject: 'Task Z-tDsP4jQ3OUTjN0Q6LNKQ is Complete',
      content: 'Task Z-tDsP4jQ3OUTjN0Q6LNKQ is finished. It took 124 minutes.',
      link: {text: 'Inspect Task', href: 'https://tools.taskcluster.net/task-inspector/#Z-tDsP4jQ3OUTjN0Q6LNKQ'},
    });
    helper.checkEmails(email => {
      assert.deepEqual(email.delivery.recipients, ['success@simulator.amazonses.com']);
    });
  });

  test('does not send notifications to denylisted email address', async function() {
    // Add an address to the denylist
    await helper.apiClient.addDenylistAddress({
      notificationType: 'email',
      notificationAddress: 'success@simulator.amazonses.com',
    });
    // Ensure sending notification to that address fails with appropriate error
    try {
      await helper.apiClient.email({
        address: 'success@simulator.amazonses.com',
        subject: 'Task Z-tDsP4jQ3OUTjN0Q6LNKQ is Complete',
        content: 'Task Z-tDsP4jQ3OUTjN0Q6LNKQ is finished. It took 124 minutes.',
        link: {text: 'Inspect Task', href: 'https://tools.taskcluster.net/task-inspector/#Z-tDsP4jQ3OUTjN0Q6LNKQ'},
      });
    } catch(e) {
      assert.equal(e.code, "DenylistedAddress");
    }
  });

  test('email without link', async function() {
    await helper.apiClient.email({
      address: 'success@simulator.amazonses.com',
      subject: 'Task Z-tDsP4jQ3OUTjN0Q6LNKo is Complete',
      content: 'Task Z-tDsP4jQ3OUTjN0Q6LNKo is finished. It took 124 minutes.',
    });
    helper.checkEmails(email => {
      assert.deepEqual(email.delivery.recipients, ['success@simulator.amazonses.com']);
    });
  });

  test('email with fullscreen template', async function() {
    await helper.apiClient.email({
      address: 'success@simulator.amazonses.com',
      subject: 'Task Z-tDsP4jQ3OUTjN0Q6LNKp is Complete',
      content: 'Task Z-tDsP4jQ3OUTjN0Q6LNKp is finished. It took 124 minutes.',
      template: 'fullscreen',
    });
    helper.checkEmails(email => {
      assert.deepEqual(email.delivery.recipients, ['success@simulator.amazonses.com']);
    });
  });

  test('irc', async function() {
    await helper.apiClient.irc({message: 'Does this work?', channel: '#taskcluster-test'});
    await helper.checkSQSMessage(helper.ircSQSQueue, body => {
      assert.equal(body.channel, '#taskcluster-test');
      assert.equal(body.message, 'Does this work?');
    });
  });

  test('does not send notifications to denylisted irc channel', async function() {
    // Add an irc-channel address to the denylist
    await helper.apiClient.addDenylistAddress({
      notificationType: 'irc-channel',
      notificationAddress: '#taskcluster-test',
    });
    // Ensure sending notification to that address fails with appropriate error
    try {
      await helper.apiClient.irc({message: 'Does this work?', channel: '#taskcluster-test'});
    } catch(e) {
      assert(e.code, 'DenylistedAddress');
    }
  });

  test('does not send notifications to denylisted irc user', async function() {
    await helper.apiClient.addDenylistAddress({notificationType: 'irc-user', notificationAddress: 'notify-me'});
    try {
      await helper.apiClient.irc({message: 'Does this work?', user: 'notify-me'});
    } catch(e) {
      assert(e.code, 'DenylistedAddress');
    }
  });

  test('Denylist: addDenylistAddress()', async function() {
    // Try adding an address to the denylist
    await helper.apiClient.addDenylistAddress(dummyAddress1);

    // Check that the address was successfully added
    let item = await helper.DenylistedNotification.load(dummyAddress1);
    item = item._properties;
    assert.deepEqual(item, dummyAddress1);

    // Duplicate addresses should not throw an exception
    await helper.apiClient.addDenylistAddress(dummyAddress1);
  });

  test('Denylist: deleteDenylistAddress()', async function() {
    // Add some items
    await helper.apiClient.addDenylistAddress(dummyAddress1);
    await helper.apiClient.addDenylistAddress(dummyAddress2);

    // Make sure they are added
    let items = await helper.DenylistedNotification.scan({});
    items = items.entries;
    assert(items.length, 2);

    // Remove an item and check for success
    await helper.apiClient.deleteDenylistAddress(dummyAddress1);
    items = await helper.DenylistedNotification.scan({});
    items = items.entries;
    assert(items.length, 1);

    // Only dummyAddress2 should be left in the table
    let item = items[0]._properties;
    assert.deepEqual(item, dummyAddress2);

    // Removing non-existant addresses should not throw an exception
    await helper.apiClient.deleteDenylistAddress(dummyAddress1);
  });

  test('Denylist: list()', async function() {
    // Call list() on an empty table
    let addressList = await helper.apiClient.list();
    assert(addressList.addresses, []);

    // Add some items
    await helper.DenylistedNotification.create(dummyAddress1);
    await helper.DenylistedNotification.create(dummyAddress2);

    // check the result of list()
    addressList = await helper.apiClient.list();
    let expectedResult = [dummyAddress1, dummyAddress2].sort();
    assert.deepEqual(addressList.addresses.sort(), expectedResult);
  });
});

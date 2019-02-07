// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import Client from '../Client';

export default class PurgeCache extends Client {
  constructor(options = {}) {
    super({
      serviceName: 'purge-cache',
      serviceVersion: 'v1',
      exchangePrefix: '',
      ...options,
    });
    this.ping.entry = {type:'function',method:'get',route:'/ping',query:[],args:[],name:'ping',stability:'stable'}; // eslint-disable-line
    this.purgeCache.entry = {type:'function',method:'post',route:'/purge-cache/<provisionerId>/<workerType>',query:[],args:['provisionerId','workerType'],name:'purgeCache',stability:'stable',input:true,scopes:'purge-cache:<provisionerId>/<workerType>:<cacheName>'}; // eslint-disable-line
    this.allPurgeRequests.entry = {type:'function',method:'get',route:'/purge-cache/list',query:['continuationToken','limit'],args:[],name:'allPurgeRequests',stability:'stable',output:true}; // eslint-disable-line
    this.purgeRequests.entry = {type:'function',method:'get',route:'/purge-cache/<provisionerId>/<workerType>',query:['since'],args:['provisionerId','workerType'],name:'purgeRequests',stability:'stable',output:true}; // eslint-disable-line
  }
  /* eslint-disable max-len */
  // Respond without doing anything.
  // This endpoint is used to check that the service is up.
  /* eslint-enable max-len */
  ping(...args) {
    this.validate(this.ping.entry, args);

    return this.request(this.ping.entry, args);
  }
  /* eslint-disable max-len */
  // Publish a purge-cache message to purge caches named `cacheName` with
  // `provisionerId` and `workerType` in the routing-key. Workers should
  // be listening for this message and purge caches when they see it.
  /* eslint-enable max-len */
  purgeCache(...args) {
    this.validate(this.purgeCache.entry, args);

    return this.request(this.purgeCache.entry, args);
  }
  /* eslint-disable max-len */
  // This is useful mostly for administors to view
  // the set of open purge requests. It should not
  // be used by workers. They should use the purgeRequests
  // endpoint that is specific to their workerType and
  // provisionerId.
  /* eslint-enable max-len */
  allPurgeRequests(...args) {
    this.validate(this.allPurgeRequests.entry, args);

    return this.request(this.allPurgeRequests.entry, args);
  }
  /* eslint-disable max-len */
  // List of caches that need to be purged if they are from before
  // a certain time. This is safe to be used in automation from
  // workers.
  /* eslint-enable max-len */
  purgeRequests(...args) {
    this.validate(this.purgeRequests.entry, args);

    return this.request(this.purgeRequests.entry, args);
  }
}

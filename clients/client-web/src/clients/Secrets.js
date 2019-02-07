// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import Client from '../Client';

export default class Secrets extends Client {
  constructor(options = {}) {
    super({
      serviceName: 'secrets',
      serviceVersion: 'v1',
      exchangePrefix: '',
      ...options,
    });
    this.ping.entry = {type:'function',method:'get',route:'/ping',query:[],args:[],name:'ping',stability:'stable'}; // eslint-disable-line
    this.set.entry = {type:'function',method:'put',route:'/secret/<name>',query:[],args:['name'],name:'set',stability:'stable',input:true,scopes:'secrets:set:<name>'}; // eslint-disable-line
    this.remove.entry = {type:'function',method:'delete',route:'/secret/<name>',query:[],args:['name'],name:'remove',stability:'stable',scopes:'secrets:set:<name>'}; // eslint-disable-line
    this.get.entry = {type:'function',method:'get',route:'/secret/<name>',query:[],args:['name'],name:'get',stability:'stable',output:true,scopes:'secrets:get:<name>'}; // eslint-disable-line
    this.list.entry = {type:'function',method:'get',route:'/secrets',query:['continuationToken','limit'],args:[],name:'list',stability:'stable',output:true}; // eslint-disable-line
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
  // Set the secret associated with some key.  If the secret already exists, it is
  // updated instead.
  /* eslint-enable max-len */
  set(...args) {
    this.validate(this.set.entry, args);

    return this.request(this.set.entry, args);
  }
  /* eslint-disable max-len */
  // Delete the secret associated with some key.
  /* eslint-enable max-len */
  remove(...args) {
    this.validate(this.remove.entry, args);

    return this.request(this.remove.entry, args);
  }
  /* eslint-disable max-len */
  // Read the secret associated with some key.  If the secret has recently
  // expired, the response code 410 is returned.  If the caller lacks the
  // scope necessary to get the secret, the call will fail with a 403 code
  // regardless of whether the secret exists.
  /* eslint-enable max-len */
  get(...args) {
    this.validate(this.get.entry, args);

    return this.request(this.get.entry, args);
  }
  /* eslint-disable max-len */
  // List the names of all secrets.
  // By default this end-point will try to return up to 1000 secret names in one
  // request. But it **may return less**, even if more tasks are available.
  // It may also return a `continuationToken` even though there are no more
  // results. However, you can only be sure to have seen all results if you
  // keep calling `listTaskGroup` with the last `continuationToken` until you
  // get a result without a `continuationToken`.
  // If you are not interested in listing all the members at once, you may
  // use the query-string option `limit` to return fewer.
  /* eslint-enable max-len */
  list(...args) {
    this.validate(this.list.entry, args);

    return this.request(this.list.entry, args);
  }
}

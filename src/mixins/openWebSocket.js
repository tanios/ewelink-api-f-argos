const fetch = require('node-fetch');
const W3CWebSocket = require('websocket').w3cwebsocket;
const WebSocketAsPromised = require('websocket-as-promised');

const wssLoginPayload = require('../payloads/wssLoginPayload');
const errors = require('../data/errors');

module.exports = {
  /**
   * Open a socket connection to eWeLink
   * and execute callback function with server message as argument
   *
   * @param callback
   * @param heartbeat
   * @returns {Promise<WebSocketAsPromised>}
   */
  async openWebSocket(callback, ...{ heartbeat = 10000 }) {
    if (this.activeWebSocket === true)
      return console.error('WebSocket already open');
    const dispatch = await this.getWebSocketServer();
    const WSS_URL = `wss://${dispatch.domain}:${dispatch.port}/api/ws`;

    const { socketRequestCallback } = this;

    if( typeof socketRequestCallback === 'function' ) {

        try {

          socketRequestCallback();
        }
        catch( cbErr ) {}
    }

    let payloadLogin = wssLoginPayload({
      at: this.at,
      apiKey: this.apiKey,
      appid: this.APP_ID,
    });

    this.wsp = new WebSocketAsPromised(WSS_URL, {
      createWebSocket: (wss) => new W3CWebSocket(wss),
    });

    this.wsp.onMessage.addListener((message) => {
      this.activeWebSocket = true;
      try {
        const data = JSON.parse(message);
        callback(data);
      } catch (error) {
        callback(message);
      }
    });

    await this.wsp.open();
    await this.wsp.send(payloadLogin);

    const interval = setInterval(async () => {
      try {
        await this.wsp.send('ping');
      } catch (error) {
        this.activeWebSocket = false;
        clearInterval( interval );
        console.error(`openWebSocket.js: ${error}`);
        console.log(`openWebSocket.js: Reconnecting...`);
        await this.openWebSocket( callback, {heartbeat: heartbeat} );
      }
    }, heartbeat);

    this.wsp.onClose.addListener(() => {
      console.log(`openWebSocket.js: Connection closed`);
      clearInterval(interval);
      this.activeWebSocket = false;
      this.wsp = undefined;
    });

    return this.wsp;
  },

  async getWebSocketServer() {
    const requestUrl = this.getDispatchServiceUrl();
    const request = await fetch(`${requestUrl}/dispatch/app`);
    if (!request.ok) {
      throw new Error(`[${request.status}] ${errors[request.status]}`);
    }

    return request.json();
  },
};

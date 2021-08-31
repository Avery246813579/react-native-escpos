"use strict";
const net = require("react-native-tcp-socket");
const TcpSocket = require("react-native-tcp-socket");
const util = require("util");
const EventEmitter = require("events");

/**
 * Network Adapter
 * @param {[type]} address
 * @param {[type]} port
 */
function Network(address, port) {
  EventEmitter.call(this);
  this.address = address;
  this.port = port || 9100;
  this.device = new net.Socket();
  this.device.setKeepAlive(true, 5);

  this.attemptedReconnections = 3;
  this.isConnected = false;
  this.killed = false;
  this.timeoutId = -1;

  return this;
};

util.inherits(Network, EventEmitter);

/**
 * connect to remote device
 * @param {[type]} callback                     Basic callback for functions
 * @param {Object} params                       Parameters for callback on actions
 * @param {Function} params.onSocketClose       Function called when the socket is disconnected
 * @param {Function} params.onSocketConnect     Function called when the socket is connected
 * @param {Function} params.onSocketKill        Function called when the socket is killed after reconnect attempts
 *
 * @return
 */
Network.prototype.open = function (callback, params = {}) {
  var self = this;

  const client = TcpSocket.createConnection({
    host: this.address,
    port: this.port,
  }, (err) => {
    self.device = client;
    self.isConnected = true;

    callback && callback(err, self.device);
  });

  client.on("error", (err) => {
    self.killed = true;

    params.onSocketKill && params.onSocketKill(self.device);
    callback && callback(err, self.device);
  }).on("close", () => {
    // console.log("WE CLOSED?");
  });

  return this;
};

/**
 * write data to printer
 * @param {[type]} data -- byte data
 * @return
 */
Network.prototype.write = function (data, callback) {
  this.device.write(data, callback);
  return this;
};

/**
 * Checks if the current socket is connected or not
 *
 * @return {Boolean}
 */
Network.prototype.isConnected = function () {
  return this.isConnected;
};

Network.prototype.read = function (callback) {
  this.device.on("data", buf => {
    callback && callback(buf);
  });
  return this;
};

/**
 * [close description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Network.prototype.close = function (callback) {
  if (this.device && this.isConnected) {
    this.device.destroy();
    this.device = null;
  }

  this.emit("disconnect", this.device);
  callback && callback(null, this.device);
  return this;
};

module.exports = Network;

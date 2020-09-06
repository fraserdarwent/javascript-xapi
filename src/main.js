'use strict';

import WebSocket from 'ws';
import lib from './lib.js';

const throttle = lib.throttle(50);

let lastRequestTime = new Date().getTime();

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getSymbols(ws) {
  return new Promise((resolve, reject) => {
    ws.send(
      JSON.stringify({
        command: 'getAllSymbols',
        customTag: 'symbols',
      })
    );

    ws.on('message', message => {
      const response = JSON.parse(message);
      if (response.customTag === 'symbols') {
        if (response.status === true) {
          const symbols = response.returnData.map(symbol => symbol.symbol);
          resolve(symbols);
        } else {
          reject(message);
        }
      }
    });
  });
}
function ticksPromise(ws, symbol, callback) {
  return new Promise((resolve, reject) => {
    ws.send(
      JSON.stringify({
        command: 'getChartRangeRequest',
        arguments: {
          info: {
            period: 1440,
            start: new Date().getTime(),
            symbol: symbol,
            ticks: -365 * 15,
          },
        },
        customTag: 'ticks',
      })
    );

    ws.on('message', message => {
      const response = JSON.parse(message);
      if (response.customTag === 'ticks') {
        if (response.status === true) {
          if (callback) {
            callback();
          }
          resolve(response.returnData.rateInfos);
        } else {
          reject(message);
        }
      }
    });
  });
}

function ticksFlow(params) {
  return delay(Math.random() * 1000).then(_ =>
    login(params.configuration).then(ws =>
      delay(200).then(_ =>
        ticksPromise(ws, params.symbol, params.callback).then(ticks =>
          delay(200).then(_ => logout(ws).then(_ => ticks))
        )
      )
    )
  );
}

function logout(ws) {
  return new Promise((resolve, reject) => {
    ws.send(
      JSON.stringify({
        command: 'logout',
        customTag: 'logout',
      })
    );

    ws.on('close', _ => {
      resolve();
    });

    ws.on('message', message => {
      const response = JSON.parse(message);
      if (response.customTag === 'logout') {
        if (response.status === true) {
          ws.close();
        } else {
          reject(error);
        }
      }
    });
  });
}

function login(configuration) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('wss://ws.xtb.com/demo');

    ws.on('error', error => {
      console.error(error);
      process.exit(1);
    });

    ws.on('open', () => {
      ws.send(
        JSON.stringify({
          command: 'login',
          arguments: {
            userId: configuration.userId,
            password: configuration.password,
          },
          customTag: 'login',
        })
      );
    });

    ws.on('message', message => {
      const response = JSON.parse(message);
      if (response.customTag === 'login') {
        if (response.status === true) {
          resolve(ws);
        } else {
          reject(message);
        }
      }
    });
  });
}

export default class XAPI {
  configuration = {};

  constructor(configuration) {
    this.configuration = configuration;
  }

  ticks(symbols, callback) {
    if (typeof symbols === 'string') {
      symbols = [symbols];
    }
    return Promise.all(
      symbols.map(symbol =>
        throttle(ticksFlow)({
          configuration: this.configuration,
          symbol: symbol,
          callback: callback,
        }).then(ticks => {
          return {symbol: symbol, ticks: ticks};
        })
      )
    );
  }

  symbols() {
    return login(this.configuration).then(ws =>
      getSymbols(ws).then(ticks =>
        logout(ws).then(_ => {
          return ticks;
        })
      )
    );
  }
}

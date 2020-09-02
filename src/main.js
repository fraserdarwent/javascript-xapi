'use strict';

import WebSocket from 'ws';

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

function getTicks(ws, symbol) {
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
          resolve(response.returnData.rateInfos);
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

  ticks(symbol) {
    return login(this.configuration.userId, this.configuration.password).then(ws =>
      getTicks(ws, symbol).then(ticks =>
        logout(ws).then(_ => {
          return ticks;
        })
      )
    );
  }

  symbols() {
    return login(this.configuration.userId, this.configuration.password).then(ws =>
      getSymbols(ws).then(ticks =>
        logout(ws).then(_ => {
          return ticks;
        })
      )
    );
  }
}

function login(userId, password) {
  const ws = new WebSocket('wss://ws.xtb.com/demo');

  return new Promise((resolve, reject) => {
    ws.on('open', () => {
      ws.send(
        JSON.stringify({
          command: 'login',
          arguments: {
            userId: userId,
            password: password,
          },
          customTag: 'login',
        })
      );
    });

    ws.on('message', message => {
      const response = JSON.parse(message);
      if (response.customTag === 'login' && response.status === true) {
        resolve(ws);
      }
    });
  });
}

function logout(ws) {
  return new Promise((resolve, reject) => {
    ws.send(
      JSON.stringify({
        command: 'logout',
        customTag: 'logout',
      })
    );

    ws.on('message', message => {
      const response = JSON.parse(message);
      if (response.customTag === 'logout' && response.status === true) {
        resolve(ws);
      }
    });
  });
}

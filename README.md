# javascript-xapi

## Installation

```bash
yarn add @fraserdarwent/javascript-xapi
```

## Usage

```javascript
import XAPI from '@fraserdarwent/javascript-xapi';

const xapi = new XAPI({
  userId: USER_ID,
  password: PASSWORD,
  demo: true,
});

// Get all available symbols
xapi.symbols().then(symbols => {});

// Get ticks for (up to) past 15 years for symbol
xapi.ticks(symbol).then(ticks => {});
```

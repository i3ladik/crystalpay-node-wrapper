# crystalpay-wrapper

Convenient Node module for interacting with the [CrystalPAY](https://crystalpay.io/) API

# Installation

Install it from npm:

 ```
npm install crystalpay-wrapper
```

# Usage

### Create a new CrystalPAY object

 ```
const CrystalPAY = require('crystalpay-wrapper');

const crystalPay = new CrystalPAY ({
    auth_login: 'login',
    auth_secret: 'secret',
    salt: 'secret_salt'
});
```

### Creating a webhook

 ```
crystalPay.createWebhook(3000, '/invoice', 'invoice');
crystalPay.createWebhook(3000, '/payoff', 'payoff');

crystalPay.events.on('invoice', (data) => {
    const check = crystalPay.checkSignature(data);
    if (check) console.log('Signature verification passed');
    else return console.error('Signature verification failed!');
    // code
});

crystalPay.events.on('payoff', (data) => {
    const check = crystalPay.checkSignature(data);
    if (check) console.log('Signature verification passed');
    else return console.error('Signature verification failed!');
    // code
});
```

### Getting information about the shop

 ```
const response = await crystalPay.info();
```

 ```
{
  "error": false,
  "errors": [],
  "id": 123456789,
  "name": "examplename",
  "status_level": 2,
  "created_at": "2023-07-19 12:34:56"
}
```

### Getting information about payment methods

 ```
const response = await crystalPay.methods();
```

 ```
{
  "error": false,
  "errors": [],
  "methods": {
    "CRYSTALPAY": {
      "name": "CrystalPAY P2P",
      "enabled": true,
      "extra_commission_percent": 0,
      "minimal_status_level": 0,
      "currency": "RUB",
      "commission_percent": 0,
      "commission": 0
    }
    ...
  }
}
```

### Changing payment method settings

 ```
const response = await crystalPay.methodEdit('CRYSTALPAY', 0, true);
```

 ```
{
  "error": false,
  "errors": []
}
```

### Getting a shop balance

 ```
const response = await crystalPay.balance();
```

 ```
{
  "error": false,
  "errors": [],
  "balances": {
    "LZTMARKET": { "amount": 100, "currency": "RUB" },
    "BITCOIN": { "amount": 0.00005, "currency": "BTC" },
    ...
   }
}
```

### Invoicing for payment

 ```
const response = await crystalPay.invoiceCreate({
    amount: 100, // *
    type: 'topup', // *
    lifetime: 3000, // *
    amount_currency: 'RUB',
    callback_url: 'http://127.0.0.1:3000/invoice',
    description: 'invoice',
    extra: 'id=1',
    payer_details: 'test@gmail.com',
    redirect_url: 'https://google.com',
    required_method: 'LZTMARKET'
});
```
\* - required


 ```
{
  "error": false,
  "errors": [],
  "id": "123456789_abcdefghij",
  "url": "https://pay.crystalpay.io/?i=123456789_abcdefghij",
  "amount": 100,
  "type": "purchase"
}
```

### Getting invoice information

 ```
const response = await crystalPay.invoiceInfo('123456789_abcdefghij');
```

 ```
{
  "error": false,
  "errors": [],
  "id": "123456789_abcdefghij",
  "url": "https://pay.crystalpay.io/?i=123456789_abcdefghij",
  "state": "notpayed",
  "type": "purchase",
  "method": null,
  "required_method": "",
  "currency": "RUB",
  "service_commission": 0,
  "extra_commission": 0,
  "amount": 100,
  "pay_amount": 100,
  "remaining_amount": 100,
  "balance_amount": 100,
  "description": "",
  "redirect_url": "https://crystalpay.io/",
  "callback_url": "",
  "extra": "",
  "created_at": "2023-01-01 00:00:00",
  "expired_at": "2023-01-03 12:34:56"
}
```

### Creating a payoff request

 ```
const response = await crystalPay.payoffCreate({
    amount: 100, // *
    method: 'BITCOIN', // *
    subtract_from: 'balance', // *
    wallet: '123456789', // *
    amount_currency: 'ETH',
    callback_url: 'http://127.0.0.1:3000/payoff',
    extra: 'id=1'
});
```
\* - required

 ```
{
  "error": false,
  "errors": [],
  "id": "123456789_dpWminAiaqwTcBOJVlFk",
  "method": "ETHEREUM",
  "commission": 0.0015,
  "amount": 0.002,
  "rub_amount": 193,
  "receive_amount": 0.0005,
  "deduction_amount": 0.002,
  "subtract_from": "amount",
  "currency": "ETH"
}
```

### Confirmation of the payoff request

 ```
const response = await crystalPay.payoffSubmit('123456789_dpWminAiaqwTcBOJVlFk');
```
signature is automatically created


 ```
{
  "error": false,
  "errors": [],
  "id": "123456789_dpWminAiaqwTcBOJVlFk",
  "state": "processing",
  "method": "ETHEREUM",
  "currency": "ETH",
  "commission": 0.0015,
  "amount": 0.002,
  "rub_amount": 193,
  "receive_amount": 0.0005,
  "deduction_amount": 0.002,
  "subtract_from": "amount",
  "wallet": "examplewallet",
  "message": "",
  "callback_url": "",
  "extra": "",
  "created_at": "2023-01-01 11:11:11"
}
```

### Cancellation of the payoff request

 ```
const response = await crystalPay.payoffCancel('123456789_dpWminAiaqwTcBOJVlFk');
```
signature is automatically created


 ```
{
  "error": false,
  "errors": [],
  "id": "123456789_dpWminAiaqwTcBOJVlFk",
  "state": "canceled",
  "method": "ETHEREUM",
  "currency": "ETH",
  "commission": 0.0015,
  "amount": 0.002,
  "rub_amount": 193,
  "receive_amount": 0.0005,
  "deduction_amount": 0.002,
  "subtract_from": "amount",
  "wallet": "examplewallet",
  "message": "Canceled",
  "callback_url": "",
  "extra": "",
  "created_at": "2023-01-01 11:11:11"
}
```

### Getting information about a payoff request

 ```
const response = await crystalPay.payoffInfo('123456789_dpWminAiaqwTcBOJVlFk');
```
signature is automatically created


 ```
{
  "error": false,
  "errors": [],
  "id": "123456789_dpWminAiaqwTcBOJVlFk",
  "state": "canceled",
  "method": "ETHEREUM",
  "currency": "ETH",
  "commission": 0.0015,
  "amount": 0.002,
  "rub_amount": 193,
  "receive_amount": 0.0005,
  "deduction_amount": 0.002,
  "subtract_from": "amount",
  "wallet": "examplewallet",
  "message": "Canceled",
  "callback_url": "",
  "extra": "",
  "created_at": "2023-01-01 11:11:11"
}
```

### Getting a list of available currencies

 ```
const response = await crystalPay.tickers();
```

 ```
{
  "error": false,
  "errors": [],
  "tickers": [
    "BCH",
    "BNB",
    ...
  ]
}
```

### Getting the exchange rate against the ruble

 ```
const response = await crystalPay.tickerGet(["BTC", "LTC"]);
```

 ```
{
  "error": false,
  "errors": [],
  "base_currency": "RUB",
  "currencies": {
    "BTC": { "price": 1432359 },
    "LTC": { "price": 5755.99 }
  }
}
```

### Getting payment history

 ```
const response = await crystalPay.historyPayments(1, 10);
```

 ```
{
  "error": false,
  "errors": [],
  "payments": [
    {
      "id": "123456789_abcdefghij",
      "state": "notpayed",
      "method": null,
      "currency": "RUB",
      "amount": 100,
      "created_at": "2023-01-01 11:11:11",
      "expired_at": "2024-01-01 11:11:11"
    }
    ...
  ]
}
```

### Getting the payoffs history

 ```
const response = await crystalPay.historyPayoffs(1, 10);
```

 ```
{
  "error": false,
  "errors": [],
  "payoffs": [
    {
      "id": "123456789_dpWminAiaqwTcBOJVlFk",
      "state": "created",
      "method": "ETHEREUM",
      "currency": "ETH",
      "amount": 0.002,
      "created_at": "2023-01-01 11:11:11"
    }
    ...
  ]
}
```


### Getting summary history

 ```
const response = await crystalPay.historySummary();
```

 ```
{
  "error": false,
  "errors": [],
  "incoming": {
    "payed_amount": 2000,
    "total_count": 60,
    "payed_count": 5
  },
  "outgoing": {
    "payed_amount": 1500,
    "total_count": 5,
    "payed_count": 4
  }
}
```

# License

This project is licensed under the [**MIT License**](https://github.com/i3ladik/wg-easy-node-wrapper/blob/main/LICENSE). You are free to modify and distribute the code as per the terms of the license.
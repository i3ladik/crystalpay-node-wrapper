const crypto = require('crypto');
const axios = require('axios');
const express = require('express');
const EventEmitter = require('events');

/**
* CrystalPAY. Visit https://crystalpay.io/
*/
class CrystalPAY {
    /**
    * Create a new CrystalPAY object
    * @param {Object} params
    * @param {String} params.auth_login - CrystalPAY login. Specified in parentheses '(login)'
    * @param {String} params.auth_secret - The secret key of the shop
    * @param {String} params.salt - The salt ket of the shop
    * @constructor
    */
    constructor({ auth_login, auth_secret, salt }) {
        if (!auth_login) throw new Error('auth_login must be specified');
        else if (!auth_secret) throw new Error('auth_secret must be specified');
        else if (!salt) throw new Error('salt must be specified');
        this.login = auth_login;
        this.secret = auth_secret;
        this.salt = salt;

        this.apps = {};
        this.events = new EventEmitter();
        this.api = axios.create({
            baseURL: 'https://api.crystalpay.io/v2',
            headers: { 'Content-Type': 'application/json' }
        });
    }

    /**
    * Getting information about the shop
    * @returns {Promise<Object>}
    * @async
    */
    async info() {
        const { data } = await this.api.post('/me/info/', {
            auth_login: this.login,
            auth_secret: this.secret
        });
        return data;
    }

    /**
    * Getting information about payment methods
    * @returns {Promise<Object>}
    * @async
    */
    async methods() {
        const { data } = await this.api.post('/method/list/', {
            auth_login: this.login,
            auth_secret: this.secret
        });
        return data;
    }

    /**
    * Changing payment method settings
    * @param {String} method - \*required\* Payment method, for example: LZTMARKET, BITCOIN
    * @param {Number} extra_commission_percent - \*required\* Additional shop commission for the payment method as a percentage
    * @param {Boolean} enabled - \*required\* Enable/disable the payment method. Accepts true or false
    * @returns {Promise<Object>}
    * @async
    */
    async methodEdit(method, extra_commission_percent, enabled) {
        const { data } = await this.api.post('/method/edit/', {
            auth_login: this.login,
            auth_secret: this.secret,
            method,
            extra_commission_percent,
            enabled
        });
        return data;
    }

    /**
    * Getting a shop balance
    * @param {Boolean} hide_empty - Hide empty. Accepts true or false
    * @returns {Promise<Object>}
    * @async
    */
    async balance(hide_empty = false) {
        const { data } = await this.api.post('/balance/info/', {
            auth_login: this.login,
            auth_secret: this.secret,
            hide_empty
        });
        return data;
    }

    /**
    * Invoicing for payment
    * @param {Object} params - \*required\* params
    * @param {Number} params.amount - \*required\* Invoice amount, for example: 10, 0.0015
    * @param {String} params.type - \*required\* Invoice type, possible options: purchase, topup.
    * @param {String} params.lifetime - \*required\* Invoice lifetime in minutes. Maximum - 4320 min. In minutes
    * @param {String} params.amount_currency - The currency of the amount, automatically converted into rubles, for example: USD, BTC, ETH
    * @param {String} params.required_method - Forced invoice payment method, for example: LZTMARKET, BITCOIN
    * @param {String} params.description - Description
    * @param {String} params.redirect_url - Link to redirect after successful payment
    * @param {String} params.callback_url - Webhook. Link for HTTP Callback notification after successful payment
    * @param {String} params.extra - Any textual technical data, for example: tag, internal ID, payment data
    * @param {String} params.payer_details - Information about the payer, accepts: payer's email
    * @returns {Promise<Object>}
    * @async
    */
    async invoiceCreate(params) {
        const { data } = await this.api.post('/invoice/create/', {
            auth_login: this.login,
            auth_secret: this.secret,
            ...params
        });
        return data;
    }

    /**
    * Getting invoice information
    * @param {String} id - \*required\* Invoice ID, issued after invoicing
    * @returns {Promise<Object>}
    * @async
    */
    async invoiceInfo(id) {
        const { data } = await this.api.post('/invoice/info/', {
            auth_login: this.login,
            auth_secret: this.secret,
            id
        });
        return data;
    }

    /**
    * Creating a payoff request
    * 
    * \*signature is automatically created
    * @param {Object} params - \*required\* params
    * @param {Number} params.amount - \*required\* Payoff amount, for example: 10, 0.0015
    * @param {String} params.method - \*required\* Method, for example: LZTMARKET, BITCOIN
    * @param {String} params.wallet - \*required\* Details of the recipient's wallet
    * @param {String} params.subtract_from - \*required\* How to write off the commission amount, possible options: balance or amount
    * @param {String} params.amount_currency  - The currency of the amount, automatically converted into rubles, for example: USD, BTC, ETH
    * @param {String} params.callback_url - Webhook. Link for HTTP Callback notification after successful payoff
    * @param {String} params.extra - Any textual technical data, for example: tag, internal ID, payment data
    * @returns {Promise<Object>}
    * @async
    */
    async payoffCreate(params) {
        params.signature = sha1(`${params.amount}:${params.method}:${params.wallet}:${this.salt}`);
        const { data } = await this.api.post('/payoff/create/', {
            auth_login: this.login,
            auth_secret: this.secret,
            ...params
        });
        return data;
    }

    /**
    * Confirmation of the payoff request
    * 
    * \*signature is automatically created
    * @param {String} id - \*required\* ID, issued after the creation of the payoff
    * @returns {Promise<Object>}
    * @async
    */
    async payoffSubmit(id) {
        const signature = sha1(`${id}:${this.salt}`);
        const { data } = await this.api.post('/payoff/submit/', {
            auth_login: this.login,
            auth_secret: this.secret,
            id,
            signature
        });
        return data;
    }

    /**
    * Cancellation of the payoff request
    * 
    * \*signature is automatically created
    * @param {String} id - \*required\* ID, issued after the creation of the payoff
    * @returns {Promise<Object>}
    * @async
    */
    async payoffCancel(id) {
        const signature = sha1(`${id}:${this.salt}`);
        const { data } = await this.api.post('/payoff/cancel/', {
            auth_login: this.login,
            auth_secret: this.secret,
            id,
            signature
        });
        return data;
    }

    /**
    * Getting information about a payoff request
    * @param {String} id - \*required\* ID, issued after the creation of the payoff
    * @returns {Promise<Object>}
    * @async
    */
    async payoffInfo(id) {
        const { data } = await this.api.post('/payoff/info/', {
            auth_login: this.login,
            auth_secret: this.secret,
            id
        });
        return data;
    }

    /**
    * Getting a list of available currencies
    * @returns {Promise<Object>}
    * @async
    */
    async tickers() {
        const { data } = await this.api.post('/ticker/list/', {
            auth_login: this.login,
            auth_secret: this.secret
        });
        return data;
    }

    /**
    * Getting the exchange rate against the ruble
    * @param {Array} tickers - \*required\* An array of currencies, for example: ["BTC", "LTC"]
    * @returns {Promise<Object>}
    * @async
    */
    async tickerGet(tickers) {
        const { data } = await this.api.post('/ticker/get/', {
            auth_login: this.login,
            auth_secret: this.secret,
            tickers
        });
        return data;
    }

    /**
    * Getting payment history
    * @param {Number} page - \*required\* Page number, for example: 1, 2, 3
    * @param {Number} items - \*required\* The number of elements per page. Maximum - 100
    * @returns {Promise<Object>}
    * @async
    */
    async historyPayments(page, items) {
        const { data } = await this.api.post('/history/payments/', {
            auth_login: this.login,
            auth_secret: this.secret,
            page,
            items
        });
        return data;
    }

    /**
    * Getting the payoffs history
    * @param {Number} page - \*required\* Page number, for example: 1, 2, 3
    * @param {Number} items - \*required\* The number of elements per page. Maximum - 100
    * @returns {Promise<Object>}
    * @async
    */
    async historyPayoffs(page, items) {
        const { data } = await this.api.post('/history/payoffs/', {
            auth_login: this.login,
            auth_secret: this.secret,
            page,
            items
        });
        return data;
    }

    /**
    * Getting summary history
    * @returns {Promise<Object>}
    * @async
    */
    async historySummary() {
        const { data } = await this.api.post('/history/summary/', {
            auth_login: this.login,
            auth_secret: this.secret
        });
        return data;
    }

    /**
    * Creating a webhook for receiving callbacks
    * @param {Number} port - \*required\* Listening port
    * @param {Number} path - \*required\* Request path
    * @param {String} eventName - \*required\* Event name
    */
    createWebhook(port, path, eventName) {
        if (this.apps[port]) {
            const app = this.apps[port];

            app.post(path, (req, res) => {
                res.send('OK');
                this.events.emit(eventName, req.body);
            });
        }
        else {
            const app = express();
            app.use(express.json());

            app.post(path, (req, res) => {
                res.send('OK');
                this.events.emit(eventName, req.body);
            }).listen(port);
            this.apps[port] = app;
        }
    }

    /**
    * Signature verification
    * @param {Object} data - \*required\* ivoice/payoff data
    * @returns {Boolean}
    */
    checkSignature(data) {
        return data.signature == sha1(data.id + ':' + this.salt);
    }
}

function sha1(data) {
    return crypto.createHash('sha1').update(data).digest('hex');
}

module.exports = CrystalPAY;

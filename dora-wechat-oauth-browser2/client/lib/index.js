/**
 * Created on 2017/5/15.
 * @fileoverview 请填写简要的文件说明.
 * @author joc (Chen Wen)
 */
'use strict';
var OAuth = require('dora-oauth-browser2');

var inWxBrowser = function () {
    return /micromessenger/.test(navigator.userAgent.toLowerCase());
};

function WechatOAuth (appId, options) {
    options = options || {};
    options.serviceName = 'wechat';
    OAuth.call(this, appId, options);
    var self = this;
    self.inWxBrowser = inWxBrowser();
    self.env = options.env;

    !options.loginLater && self.onPageLoadLogin();
}

OAuth.inherits(WechatOAuth, OAuth);

WechatOAuth.prototype.encodeState = function (credentialToken, loginStyle, redirectUrl, options) {
    options = options || {};
	var obj = {};
    Object.keys(options).forEach(function (key) {
        if (!['scope', 'loginStyle', 'redirectUrl'].includes(key)) {
            obj[key] = options[key];
        }
    });

    var str = this._callSuper('encodeState', Object.assign(obj, {
        e: this.env,
        l: loginStyle,
        r: redirectUrl,
        c: credentialToken
    }));

    if (this.inWxBrowser) {
        if (str.length > 128) {
            throw new Error('state is overlength:', str.length);
        }
        if (str.length > 100) {
            console.warn('state length:', str.length);
        }
    }

    return str;
};

WechatOAuth.prototype.authorizeURLBase = function (loginStyle) {
    return loginStyle === 'popup' ?
           'https://open.weixin.qq.com/connect/qrconnect' :
           'https://open.weixin.qq.com/connect/oauth2/authorize';
};

WechatOAuth.prototype._getUrlByLoginStyle = function (loginStyle, state, scope) {
    return this._callSuper('getAuthorizeURL', loginStyle, state, {
        query: {
            appid: this.appid,
            redirect_uri: this.oauthHandleUrl,
            response_type: 'code',
            scope: scope || 'snsapi_userinfo',
            state: state || ''
        },
        hash: 'wechat_redirect'
    });
};

WechatOAuth.prototype.getAuthorizeURL = function (loginStyle, state, options) {
    options = options || {};
    if (loginStyle === 'popup') {
        return this.getAuthorizeURLForWebsite(state, options);
    }
    
    return this._getUrlByLoginStyle(loginStyle || 'redirect', state, options.scope);
};

WechatOAuth.prototype.getAuthorizeURLForWebsite = function (state, options) {
    options = options || {};
    return this._getUrlByLoginStyle('popup', state, options.scope || 'snsapi_login');
};

WechatOAuth.prototype.getCredentialToken = function () {
    return OAuth.Random.id();
};

module.exports = WechatOAuth;

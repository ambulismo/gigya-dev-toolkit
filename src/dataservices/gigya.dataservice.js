'use strict';

const superagent = require('superagent');
const _ = require('lodash');

class GigyaDataservice {
  static _cacheMap = new Map();

  static fetchUserSites({ userKey, userSecret, partnerId }) {
    return GigyaDataservice._api({
      endpoint: 'admin.getUserSites',
      userKey,
      userSecret,
      params: { targetPartnerID: partnerId },
      transform: (res) => res.sites,
      isUseCache: true
    });
  }

  static fetchSchema({ userKey, userSecret, apiKey }) {
    return GigyaDataservice._api({ endpoint: 'accounts.getSchema', userKey, userSecret, params: { apiKey }, transform: (schema) => {
      // Profile schema has a bunch of things that are read-only
      // We don't save these to the file because they never change
      delete schema.profileSchema.unique;
      delete schema.profileSchema.dynamicSchema;
      _.each(schema.profileSchema.fields, (field, key) => {
        delete field.arrayOp;
        delete field.allowNull;
        delete field.type;
        delete field.encrypt;
        delete field.format;
      });

      // Cannot set empty unique field on dataSchema or error
      if(schema.dataSchema.unique && _.isArray(schema.dataSchema.unique) && schema.dataSchema.unique.length === 0) {
        delete schema.dataSchema.unique;
      }

      // Remove fields from dataSchema that do not have a type
      _.each(schema.dataSchema.fields, (field, key) => {
        if(!field.type) {
          delete schema.dataSchema.fields[key];
        }
      });

      return schema;
    } });
  }

  static fetchPolicies({ userKey, userSecret, apiKey }) {
    return GigyaDataservice._api({ endpoint: 'accounts.getPolicies', userKey, userSecret, params: { apiKey } });
  }

  static fetchScreensets({ userKey, userSecret, apiKey }) {
    return GigyaDataservice._api({
      endpoint: 'accounts.getScreenSets',
      userKey,
      userSecret,
      params: { apiKey },
      transform: (res) => res.screenSets
    });
  }

  static updateSchema({ userKey, userSecret, apiKey, schema }) {
    const params = {
      apiKey,
      profileSchema: schema.profileSchema,
      dataSchema: schema.dataSchema
    };
    return GigyaDataservice._api({ endpoint: 'accounts.setSchema', userKey, userSecret, params });
  }

  static updatePolicies({ userKey, userSecret, apiKey, policies }) {
    const params = _.merge(policies, { apiKey });
    return GigyaDataservice._api({ endpoint: 'accounts.setPolicies', userKey, userSecret, params });
  }

  static updateScreensets({ userKey, userSecret, apiKey, screensets }) {
    const promises = [];
    _.each(screensets, ({ screenSetID, html, css }) => {
      const params = { apiKey, screenSetID, html, css };
      promises.push(GigyaDataservice._api({ endpoint: 'accounts.setScreenSet', userKey, userSecret, params }));
    });
    return promises;
  }

  static _api({ apiDomain = 'us1.gigya.com', endpoint, userKey, userSecret, params, transform, isUseCache = false }) {
    return new Promise((resolve, reject) => {
      let body;

      params = params ? _.cloneDeep(params) : {};
      params.userKey = userKey;
      params.secret = userSecret;

      // Serialize objects as JSON
      _.each(params, (param, key) => {
        if(_.isObject(param)) {
          params[key] = JSON.stringify(param);
        }
      });

      // Fire request with params
      const namespace = endpoint.substring(0, endpoint.indexOf('.'));
      let url = `https://${namespace}.${apiDomain}/${endpoint}`;

      // Create cache key
      const cacheKey = isUseCache ? url + JSON.stringify(params) : undefined;

      // Check cache and use cached response if we have it
      body = GigyaDataservice._cacheMap.get(cacheKey);
      if(body && isUseCache) {
        // Clone to avoid object that lives in cache being modified by reference
        return onBody(_.cloneDeep(body));
      }

      // Prefix URL with /proxy/ if in browser
      if(process.browser) {
        // URL is double-encoded to prevent server errors in some environments
        url = 'proxy/' + encodeURIComponent(encodeURIComponent(url));
      }

      // Fire request
      superagent.post(url)
        .type('form')
        .send(params)
        .end((err, res) => {
          try {
            // Check for network error
            if(err) {
              return reject(err);
            }

            // Parse JSON
            body = JSON.parse(res.text);

            // Cache response
            if(isUseCache) {
              // Clone to avoid object that lives in cache being modified by reference after cache
              GigyaDataservice._cacheMap.set(cacheKey, _.cloneDeep(body));
            }

            onBody(body);
          } catch(e) {
            reject(e);
          }
        });

      function onBody(body) {
        // Check for wrong data center
        if(body.errorCode === 301001 && body.apiDomain) {
          // Try again with correct data center
          return GigyaDataservice._api({
            apiDomain: body.apiDomain,
            endpoint,
            userKey,
            userSecret,
            params,
            transform
          }).then(resolve, reject);
        }

        // Check for Gigya error code
        if(body.errorCode !== 0) {
          return reject(new Error(body.errorDetails ? body.errorDetails : body.errorMessage));
        }

        // Don't return trash
        delete body.callId;
        delete body.errorCode;
        delete body.statusCode;
        delete body.statusReason;
        delete body.time;

        // Transform response if necessary
        if(transform) {
          body = transform(body);
        }

        // Gigya response OK
        return resolve(body);
      }
    });
  }
}

module.exports = GigyaDataservice;
var assert = require('assert')
, log = require('../log')(__filename)
, debug = log.debug

module.exports = exports = function(app) {
    exports.app = app
    app.use(exports.handler)
    return exports
}

exports.lookup = function(key, cb) {
    return exports.app.security.users.fromApiKey(key, function(err, item) {
        if (err) return cb(err)
        cb(null, item)
    })
}

exports.handler = function(req, res, next) {
    if (!req.query.key) return next()
    exports.lookup(req.query.key, function(err, key) {
        if (err) return next(err)
        if (!key) {
            return res.status(401).send({
                name: 'ApiKeyNotFound',
                message: 'API key not found'
            })
        }

        req.apikey = key

        exports.app.security.users.fromUserId(key.userId, function(err, user) {
            if (err) return next(err)
            assert(user)
            req.user = user
            //debug('api key %s attached (user #%d)', key.id.substr(0, 10), user.id)
            next()
        })
    })
}

exports.getUserFromApiKey = function(apiKey, cb) {
    //debug("getUserFromApiKey");
    exports.lookup(apiKey, function(err, key) {
        if (err) return cb(err)
        if (!key) {
            return cb({
                name: 'ApiKeyNotFound',
                message: 'API key not found'
            })
        }

        exports.app.security.users.fromUserId(key.userId, function(err, user) {
            if (err) return cb(err)
            assert(user)
            //debug('getUserFromApiKey: %s attached (user #%d)', key.id.substr(0, 10), user.id)
            cb(null, {key:key, user:user})
        })
    })
}
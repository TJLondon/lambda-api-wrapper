'use strict';
require('dotenv').config({ path: './variables.env' });
const MongoClient = require('mongodb').MongoClient;
const Geo = require('geo-nearby');
let uri  = "mongodb://localhost:27017/cafeoctane";

module.exports.getAll = (event, context, callback) => {
    MongoClient.connect(process.env.DB, function(err, client) {
        client.db('cafeoctane').collection('events')
            .find()
            .toArray((err, result) => {
                callback(
                    null,
                    {
                        statusCode: 200,
                        body: JSON.stringify(result)
                    }
                )
            })
    });
};

module.exports.filterBy = (event, context, callback) => {
    let limit = event.pathParameters.limit,
        page = --event.pathParameters.page,

        dateStart = event.queryStringParameters.dateStart,
        dateEnd = event.queryStringParameters.dateEnd,

        category = event.queryStringParameters.category,

        lat = Number(event.queryStringParameters.lat),
        lng = Number(event.queryStringParameters.lng),
        radius = Number(event.queryStringParameters.radius),
        hasCateogry = false;

        category ? hasCateogry = true : hasCateogry = false;

        const loc = {
            lat: Number(lat),
            lng: Number(lng),
            radius: Number((radius*1000) * 1.60934) // miles to metres
        };

    let resultsArray = [],
        tempArray = [];

    if (!hasCateogry) {
        MongoClient.connect(process.env.DB, function (err, client) {
            client.db('cafeoctane').collection('events')
                .find({
                    eventStart: {
                        $gte: new Date(dateStart),
                        $lt: new Date(dateEnd)
                    }
                }).sort({eventStart: 1})
                .toArray((err, result) => {
                    const geo = new Geo(result);
                    tempArray.push(geo.nearBy(loc.lat, loc.lng, loc.radius));
                    resultsArray.push(tempArray[0].slice(page * limit, (page + 1) * limit));
                    resultsArray.push({pages: Math.ceil((tempArray[0].length) / limit), results: tempArray[0].length});
                    callback(
                        null,
                        {
                            statusCode: 200,
                            body: JSON.stringify(resultsArray)
                        }
                    )
                })
        });
    }
};

module.exports.trending = (event, context, callback) => {
    let limit = event.pathParameters.limit;

    MongoClient.connect(process.env.DB, function(err, client) {
        client.db('cafeoctane').collection('events')
            .find({
                trending: true,
                eventStart: {
                    $gte: new Date()
                }
            })
            .sort({eventStart: 1})
            .limit(parseInt(limit))
            .toArray((err, result) => {
                callback(
                    null,
                    {
                        statusCode: 200,
                        body: JSON.stringify(result)
                    }
                )
            })
    });
};

module.exports.history = (event, context, callback) => {
    let ids = event.body.events.map(function (obj){ return ObjectId(obj)}),
        limit = event.pathParameters.limit;
    MongoClient.connect(process.env.DB, function(err, client) {
        client.db('cafeoctane').collection('events')
            .find({
                _id: { $in: ids }
            })
            .sort({eventStart: 1})
            .limit(parseInt(limit))
            .toArray((err, result) => {
                callback(
                    null,
                    {
                        statusCode: 200,
                        body: JSON.stringify(result)
                    }
                )
            })
    });
};

module.exports.categories = (event, context, callback) => {
    MongoClient.connect(process.env.DB, function(err, client) {
        client.db('cafeoctane').collection('eventType')
            .find()
            .sort({eventTypeTitle: 1})
            .toArray((err, result) => {
                callback(
                    null,
                    {
                        statusCode: 200,
                        body: JSON.stringify(result)
                    }
                )
            })
    });
};
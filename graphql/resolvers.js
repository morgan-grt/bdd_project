const MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
const assert = require('assert');
const { GraphQLDateTime } = require('graphql-iso-date')

// Connection URL
//const url = 'mongodb://root:example@mongodb:27017';
//const url = 'mongodb://root:example@127.0.0.1:27017';
const url = 'mongodb://root:example@172.18.0.3:27017';

// Database Name
const dbName = 'weather_db';

// Create a new MongoClient
const client = new MongoClient(url, {useUnifiedTopology: true});

const findDocuments = function (db, col, query, callback) 
{
    // Get the documents collection
    const collection = db.collection(col);
    // Find some documents
    console.log(query)
    collection.find(query).toArray(function (err, docs) {
        assert.equal(err, null);
        callback(docs);
    });
}

const findOneDocument = function (db, col, query, callback) 
{
    // Get the documents collection
    const collection = db.collection(col);
    // Find some documents
    collection.findOne(query, function (err, docs) {
        assert.equal(err, null);
        callback(docs);
    });
}

const countDocuments = function (db, col, query, callback) 
{
    // Get the documents collection
    const collection = db.collection(col);
    // Find some documents
    collection.countDocuments(query, function (err, docs) {
        assert.equal(err, null);
        callback(docs);
    });
}

const distinctDocuments = function (db, col, query, callback) 
{
    // Get the documents collection
    const collection = db.collection(col);
    // Find some documents
    collection.distinct(query, function (err, docs) {
        assert.equal(err, null);
        callback(docs);
    });
}

const paginationDocuments = function (db, col, query, sorting, limit, skip, callback) 
{
    // Get the documents collection
    const collection = db.collection(col);
    // Find some documents
    collection.find(query).sort(sorting).limit(limit).skip(skip).toArray( function (err, docs) {
        assert.equal(err, null);
        callback(docs);
    });
}

const sortedDocuments = function (db, col, query, sorting, callback) 
{
    // Get the documents collection
    const collection = db.collection(col);
    // Find some documents
    collection.find(query).sort(sorting).toArray( function (err, docs) {
        assert.equal(err, null);
        callback(docs);
    });
}

client.connect(function (err) {
    assert.equal(err, null);
    console.log("Connected correctly to the MongoDB server");
});


// un résolveur simple pour la requête 'books' de type Query
// qui renvoie la variable 'books'
const resolvers = {
    Query: {
        CountItem(root, args, context) 
        {
            return new Promise((resolve, reject) => {
                const db = client.db(dbName);
                countDocuments(db, 'weather', {}, resolve);
            }).then(result => {
                return result
            });
        },
        Weathers(root, args, context) 
        {
            return new Promise((resolve, reject) => {
                const db = client.db(dbName);
                findDocuments(db, 'weather', {}, resolve);
            }).then(result => {
                return result
            });
        },
        Country(root, args, context) 
        {
            console.log(args.country);
            return new Promise((resolve, reject) => {
                const db = client.db(dbName);
                findDocuments(db, 'weather', { country : args.country }, resolve);
            }).then(result => {
                return result
            });
        },
        Countrys(root, args, context) 
        {
            console.log(args);
            list = []
            for (c in args.country)
            {
                list.push({country:args.country[c]});
            }
            console.log(list);
            return new Promise((resolve, reject) => {
                const db = client.db(dbName);
                findDocuments(db, 'weather', { $or:list }, resolve);
            }).then(result => {
                return result
            });
        },
        City(root, args, context) 
        {
            console.log(args.city);
            return new Promise((resolve, reject) => {
                const db = client.db(dbName);
                findDocuments(db, 'weather', { city : args.city }, resolve);
            }).then(result => {
                return result
            });
        },
        Citys(root, args, context) 
        {
            console.log(args);
            list = []
            for (c in args.city)
            {
                list.push({city:args.city[c]});
            }
            console.log(list);
            return new Promise((resolve, reject) => {
                const db = client.db(dbName);
                findDocuments(db, 'weather', { $or:list }, resolve);
            }).then(result => {
                return result
            });
        },
        Distinct(root, args, context) 
        {
            console.log(args);
            return new Promise((resolve, reject) => {
                const db = client.db(dbName);
                distinctDocuments(db, 'weather', args.row , resolve);
            }).then(result => {
                return result
            });
        },
        Custom(root, args, context) 
        {
            console.log(args);
            return new Promise((resolve, reject) => {
                const db = client.db(dbName);
                findDocuments(db, 'weather', args, resolve);
            }).then(result => {
                return result
            });
        },
        Range(root, args, context) 
        {
            console.log(args);
            let sorting = {}, limit, skip;
            
            if ("sortBy" in args && "sortMethod" in args)
            {
                for (index in args.sortBy)
                {
                    if (args.sortBy[index] != undefined && args.sortMethod[index] != undefined)
                    {
                        sorting[args.sortBy[index]] = args.sortMethod[index];
                        console.log(sorting[args.sortBy[index]]);
                    }
                    else{sorting[args.sortBy[index]] = args.sortMethod[0];}
                }
                delete args.sortBy;
                delete args.sortMethod;
            }
            else{sorting = {"date": 1};}

            if ("limit" in args)
            {
                limit = args.limit;
                delete args.limit;
            }
            else{limit = 10;}

            if ("skip" in args)
            {
                skip = args.skip;
                delete args.skip;
            }
            else{skip = 0;}

            query = args;
            console.log(query, sorting, limit, skip);

            return new Promise((resolve, reject) => {
                const db = client.db(dbName);
                paginationDocuments(db, 'weather', query, sorting, limit, skip, resolve);
            }).then(result => {
                return result
            });
        },
        Multiple(root, args, context) 
        {
            console.log(args);
            let sorting = {}, limit, skip, query, tmp;
            
            if ("sortBy" in args && "sortMethod" in args)
            {
                for (index in args.sortBy)
                {
                    if (args.sortBy[index] != undefined && args.sortMethod[index] != undefined)
                    {
                        sorting[args.sortBy[index]] = args.sortMethod[index];
                    }
                    else{ sorting[args.sortBy[index]] = args.sortMethod[0]; }
                }
                delete args.sortBy;
                delete args.sortMethod;
            }
            else{sorting = {"date": 1};}

            if ("city" in args)
            {   
                tmp = '{"city": {"$in": ['
                for (index in args.city)
                {
                    tmp += `"${args.city[index]}"`
                    if (index < args.city.length - 1){ tmp += ","; }
                }
                tmp += ']}}';
                query = JSON.parse(tmp);
            }

            console.log(query, sorting);

            return new Promise((resolve, reject) => {
                const db = client.db(dbName);
                sortedDocuments(db, 'weather', query, sorting, resolve);
            }).then(result => {
                return result
            });
        }
    }
};

// on exporte la définition de 'resolvers'
module.exports = resolvers;

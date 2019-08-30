const {withFilter} = require('apollo-server');
const {testFilter} = require('./filters');
const {Transaction, Account, Block, Message} = require('./arango-filters');

function collectionQuery(db, collection, filter, log) {
	return async (parent, args) => {
		log.debug(`Query ${collection.name}`, args);
		return db.fetchDocs(collection, args, filter);
	}
}

function selectQuery(db) {
	return async (parent, args) => {
        const query = args.query;
	    const bindVars = JSON.parse(args.bindVarsJson);
		return JSON.stringify(await db.fetchQuery(query, bindVars));
	}
}


function collectionSubscription(pubsub, collectionName, filterType) {
	return {
		subscribe: withFilter(
			() => {
				return pubsub.asyncIterator(collectionName);
			},
			(data, args) => {
				return testFilter(data[collectionName], args.filter, filterType);
			}
		),
	}
}


function createResolvers(db, pubsub, logs) {
	const log = logs.create('Q Resolvers');
	return {
		Query: {
			transactions: collectionQuery(db, db.transactions, Transaction, log),
			messages: collectionQuery(db, db.messages, Message, log),
			accounts: collectionQuery(db, db.accounts, Account, log),
			blocks: collectionQuery(db, db.blocks, Block, log),
            select: selectQuery(db),
		},
		Subscription: {
			transactions: collectionSubscription(pubsub, 'transactions', Transaction),
			messages: collectionSubscription(pubsub, 'messages', Message),
			accounts: collectionSubscription(pubsub, 'accounts', Account),
			blocks: collectionSubscription(pubsub, 'blocks', Block),
		}
	}
}


module.exports = createResolvers;

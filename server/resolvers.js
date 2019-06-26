const {withFilter} = require('apollo-server');
const createMatcher = require('./matcher');

function collectionQuery(db, collection, log) {
	return async (parent, args) => {
		log.debug(`Query ${collection.name}`, args);
		return db.fetchDocs(collection, JSON.parse(args.filter));
	}
}

function selectQuery(db) {
	return async (parent, args) => {
        const query = args.query;
	    const bindVars = JSON.parse(args.bindVarsJson);
		return JSON.stringify(await db.fetchQuery(query, bindVars));
	}
}


function collectionSubscription(pubsub, collectionName) {
	return {
		subscribe: withFilter(
			() => {
				return pubsub.asyncIterator(collectionName);
			},
			(data, args) => {
				const matcher = createMatcher(JSON.parse(args.match));
				return matcher(data[collectionName]);
			}
		),
	}
}


function createResolvers(db, pubsub, logs) {
	const log = logs.create('Q Resolvers');
	return {
		Query: {
			transactions: collectionQuery(db, db.transactions, log),
			messages: collectionQuery(db, db.messages, log),
			accounts: collectionQuery(db, db.accounts, log),
			blocks: collectionQuery(db, db.blocks, log),
            select: selectQuery(db),
		},
		Subscription: {
			transactions: collectionSubscription(pubsub, 'transactions'),
			messages: collectionSubscription(pubsub, 'messages'),
			accounts: collectionSubscription(pubsub, 'accounts'),
			blocks: collectionSubscription(pubsub, 'blocks'),
		}
	}
}


module.exports = createResolvers;

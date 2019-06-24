const {withFilter} = require('apollo-server');
const createMatcher = require('./matcher');

function collectionQuery(db, collection) {
	return async (parent, args) => {
		return db.fetchDocs(collection, JSON.parse(args.filter));
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


function createResolvers(db, pubsub) {
	return {
		Query: {
			transactions: collectionQuery(db, db.transactions),
			messages: collectionQuery(db, db.messages),
			accounts: collectionQuery(db, db.accounts),
			blocks: collectionQuery(db, db.blocks),
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

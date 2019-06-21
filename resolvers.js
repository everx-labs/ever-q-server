const {withFilter} = require('apollo-server');


function queryById(db, collection) {
	return async (parent, args) => db.fetchDoc(collection, args.id)
}


function queryByFilter(db, collection) {
	return async (parent, args) => db.fetchDocs(collection, args.filter)
}


function subscriptionById(pubsub, name) {
	return {
		subscribe: withFilter(
			() => {
				return pubsub.asyncIterator(name);
			},
			(data, args) => {
				return data[name].id === args.id;
			}
		),
	}
}


function subscriptionByFilter(pubsub, name) {
	return {
		subscribe: withFilter(
			() => {
				return pubsub.asyncIterator(name)
			},
			(data, args) => {
				return true;
			}
		),
	}
}


function createResolvers(db, pubsub) {
	return {
		Query: {
			transaction: queryById(db, db.transactions),
			message: queryById(db, db.messages),
			account: queryById(db, db.accounts),
			block: queryById(db, db.blocks),

			transactions: queryByFilter(db, db.transactions),
			messages: queryByFilter(db, db.messages),
			accounts: queryByFilter(db, db.accounts),
			blocks: queryByFilter(db, db.blocks),
		},
		Subscription: {
			transaction: subscriptionById(pubsub, 'transaction'),
		}
	}
}


module.exports = createResolvers;

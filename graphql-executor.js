const {gql} = require('apollo-server');

const typeDefs = gql`
    type Transaction {
        id: String
        status: String
        now: Int
        in_msg: String
        out_msgs: [String]
        aborted: Boolean
        block_id: String
        account_addr: String
    }

    type Message {
        id: String
        status: String
        body: String
        block_id: String
    }

    type Block {
        id: String
        status: String
    }

    type AccountBalance {
        Grams: String
    }

    type Account {
        id: String
        balance: AccountBalance
        last_trans_lt: Int
    }

    type Query {
        transaction(id: String): Transaction
        message(id: String): Message
        allMessages: [Message]
        account(id: String): Account
        block(id: String): Block
    }
	
	type Subscription {
		transaction(id: String): Transaction
	}
`;


async function createExecutor(db, createLog) {
	const log = createLog('TON GraphQL Server');
	const resolvers = {
		Query: {
			transaction: async (parent, args, context, info) => db.transaction(args.id),
			message: async (parent, args, context, info) => db.message(args.id),
			allMessages: async (parent, args, context, info) => db.allMessages(),
			account: async (parent, args, context, info) => db.account(args.id),
			block: async (parent, args, context, info) => db.block(args.id),
		},
	};
	return {
		typeDefs,
		resolvers
	};
}


module.exports = createExecutor;

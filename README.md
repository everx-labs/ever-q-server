# ton-q-server
TON Database GraphQL Server

# Prerequisites

Node.js

# Install

Clone this repository and run
`sh
npm install
`

# Setup
 
 If you want to run q-server in development mode you can set EVN:
 `sh
 EXPORT Q_MODE=development
 `
 
 When Q-server run in development mode it connects to Arango DB using 'services.tonlabs.io:8529'.
 
 In production mode Q-Server connects to Arango DB using 'arangodb:8529'.
 
# Run

`sh
node index.js
`

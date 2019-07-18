# ton-q-server
TON Database GraphQL Server.

This component is a part of TON-Server and must not be accessed directly but through TON-Client.

# Prerequisites

Node.js

# Install

Clone this repository and run
```bash
npm install
```

# Setup
 
 If you want to run q-server in development mode you can set EVN:
 ```bash
 EXPORT Q_MODE="development"
 ```
 
 When Q-server run in development mode it connects to Arango DB using 'services.tonlabs.io:8529'.
 
 In production mode Q-Server connects to Arango DB using 'arangodb:8529'.
 
# Run

```bash
node index.js
```

# Connectivity

You can access Q-Server using GraphQL HTTP/WebSocket protocol on port "4000" and path "/graphql".

There is the only valid way to communicate with Q-Server – TON-Client Libray.

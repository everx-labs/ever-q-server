# ton-q-server
TON Database GraphQL Server

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

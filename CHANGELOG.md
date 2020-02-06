# Release Notes
All notable changes to this project will be documented in this file.


## 0.24.0 - Feb 6, 2020
### Featured
- Auth support

### New
- --auth-endpoint (or AUTH_ENDPOINT env) config option. Specify address of auth service.
- `authorization` optional header added to specify access token.
- `auth` optional parameter added to all GraphQL queries to specify access token in GraphQL playground.

## 0.23.0 - Feb 5, 2020

### New
- NEW: OpenTracing (jaeger) support
- NEW: workchain_id field added alongside with account address to `accounts.workchain_id`, `transactions.workchain_id`, `messages.src_workchain_id`, `messages.dst_workchain_id`

## 0.22.0 - January 22, 2020

### New
- Support for redirecting slow queries to alternative db connection.
- In scalar operations `undefined` (or missing) value is treated as `null`.

### Fixed
- Skip execution of queries with `false` filter.

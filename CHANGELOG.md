# Release Notes
All notable changes to this project will be documented in this file.


## 0.24.0 - Feb 10, 2020
### Featured
- Auth support

### New
- `--auth-endpoint` (or `AUTH_ENDPOINT` env) config option. Specify address of auth service.
- `authorization` optional header added to specify access token.
- `accessKey` optional parameter added to all GraphQL queries to specify access token in GraphQL playground.
- `getManagementAccessKey` query one time management access key.
- `registerAccessKeys` mutation to register account's access keys. 
- `revokeAccessKeys` mutation to revoke account's access keys. 

## 0.23.0 - Feb 5, 2020

### New
- OpenTracing (jaeger) support
- workchain_id field added alongside with account address to `accounts.workchain_id`, `transactions.workchain_id`, `messages.src_workchain_id`, `messages.dst_workchain_id`
- field `prev_key_block_seqno` into `blocks` collection

## 0.22.0 - January 22, 2020

### New
- Support for redirecting slow queries to alternative db connection.
- In scalar operations `undefined` (or missing) value is treated as `null`.

### Fixed
- Skip execution of queries with `false` filter.

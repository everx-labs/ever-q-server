# Release Notes
All notable changes to this project will be documented in this file.

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

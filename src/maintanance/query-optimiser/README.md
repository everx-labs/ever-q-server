# Request Log analyzer

Performs request log analyzing, finds requests that are fast actually but are marked as a slow
by slow-detector.

Generates exclusion list.

Before running this script you have to prepare data from the Request Log database.

Create aggregated metrics by `request` field into `req_stat` table:

```clickhouse
drop table if exists req_stat;
create table req_stat (
    ms_max UInt32,
    ms_min UInt32,
    ms_avg UInt32,
    ms_med UInt32,
    ms_sum UInt64,
    cost_min UInt64,
    cost_max UInt64,
    cnt UInt32,
    request String,
    event UInt8,
    last_time DateTime,
    accounts Array(String)
) engine MergeTree order by ms_med;
insert into req_stat (
    ms_max,
    ms_min,
    ms_avg,
    ms_med,
    ms_sum,
    cost_min,
    cost_max,
    cnt, request,
    event,
    last_time,
    accounts)
select
    max(res_ms) as ms_max,
    min(res_ms) as ms_min,
    avg(res_ms) as ms_avg,
    median(res_ms) as ms_med,
    sum(res_ms) as ms_sum,
    min(cost) as cost_min,
    max(cost) as cost_max,
    count(*) as cnt,
    request,
    max(event) as event,
    max(timestamp) as last_time,
    groupUniqArray(10)(dictGetOrDefault(accounts_dict, 'email', account, account)) as accounts
from queries_all
group by request
order by 4 desc;
```

Select fast and popular requests:

```clickhouse
select
    ms_sum,
    ms_med,
    cnt,
    last_time,
    request,
    accounts
from req_stat
where
    event == 2
    and position(request, 'timeout') == 0
    and position(request, 'aggregate') == 0
    and ms_med < 200
    and cnt > 1000
order by cnt desc;
```

Export results to `./secret/req_stat.csv`

Run this script.

Place output to the `src/filter/slow-query-exceptions.ts`.

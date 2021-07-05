
echo "q-server:200$1"

node index --host localhost --port 200$1 --data-mut http://localhost:2021 --data-hot http://localhost:2021 --slow-queries-mut http://localhost:2021 --slow-queries-hot http://localhost:2021 --requests-mode rest --requests-server localhost --mam-access-keys bypass

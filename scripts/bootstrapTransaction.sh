set -x
composer transaction submit  -n todolist-network-hlfv1 -p hlfv1 -i admin -s adminpw -d "{\"\$class\": \"org.example.todolist.hlfv1.Bootstrap\",\"transactionId\": \"BOOTSTRAP\"}"

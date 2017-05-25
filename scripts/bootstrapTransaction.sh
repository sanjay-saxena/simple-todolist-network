set -x
composer transaction submit  -n simple-todolist-network -p hlfv1 -i admin -s adminpw -d "{\"\$class\": \"org.example.simple.todolist.Bootstrap\",\"transactionId\": \"BOOTSTRAP\"}"

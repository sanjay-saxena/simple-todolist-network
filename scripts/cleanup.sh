set -x
rm -rf ~/.composer-connection-profiles/hlfv1/*
rm -rf ~/.hfc-key-store/*

docker stop $(docker ps -a -q)
docker rm $(docker ps -a -q)
docker rmi -f $(docker images -q)

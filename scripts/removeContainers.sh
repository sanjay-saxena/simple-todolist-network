set -x
docker stop $(docker ps -a -q)
docker rm $(docker ps -a -q)
rm -rf ~/.composer-connection-profiles/hlfv1/*
rm -rf ~/.hfc-key-store/*

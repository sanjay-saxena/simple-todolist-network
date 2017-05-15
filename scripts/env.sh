set -x
docker -v
docker-compose -v
node -v
npm -v
composer -v
cat /usr/local/lib/node_modules/yo/package.json | grep _id
docker ps -a | cut -b 1-93


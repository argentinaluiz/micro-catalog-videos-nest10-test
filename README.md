kafka-topics --bootstrap-server localhost:9092 --delete --topic 'micro-catalog-streams-.*'

DEBUG=testcontainers* npm run test:watch

docker stop $(docker ps -q --filter "label=org.testcontainers=true")
kafka-topics --bootstrap-server localhost:9092 --delete --topic 'micro-catalog-streams-.*'
kafka-console-producer --topic topico-exemplo --bootstrap-server localhost:9092

############ ver restartOnFailure

DEBUG=testcontainers* npm run test:watch

docker stop $(docker ps -q --filter "label=org.testcontainers=true")
docker rm $(docker ps -q --filter "label=org.testcontainers=true")

podemos testar o dominio
testes de integração nos use cases
testes de unidade nos controllers, mockando os use cases (variando as entradas)
testes de integração levantando o framework com a api e mockando os use cases
testes para garantir que os uses cases estão sendo carregados no framework


no container do schema-registry

 kafka-avro-console-producer --broker-list 172.17.0.1:32768 --topic schematest --property schema.registry.url=http://localhost:8081 --property value.schema.id=1


 quando não lança o KafkaRetriableException, o Nest.js converte para internal error e não temos um objeto do tipo Error lançado

 // this.consumer.on('consumer.crash', async (event) => {
    //   const error = event.payload.error as KafkaJSNonRetriableError;
    //   const causeError = error.cause;
    //   //console.log(JSON.stringify(causeError));
    //   //@ts-expect-error - error.waitMs is a number
    //   if (causeError && typeof causeError.waitMs === 'number') {
    //     //@ts-expect-error - error.waitMs is a number
    //     this.logger.log('Reconnecting consumer in ' + causeError.waitMs + 'ms');
    //     setTimeout(async () => {
    //       await this.consumer.connect();
    //       await this.bindEvents(this.consumer);
    //       //@ts-expect-error - error.waitMs is a number
    //     }, causeError.waitMs + 1000);
    //   }
    //   // if (causeError instanceof WaitBeforeProcessing) {
    //   //   setTimeout(async () => {
    //   //     await this.consumer.connect();
    //   //     await this.bindEvents(this.consumer);
    //   //   }, 500);
    //   //   // const handler = this.getMessageHandler();
    //   //   // const consumerRunOptions = Object.assign(this.options!.run || {}, {
    //   //   //   eachMessage: this.asyncRetryHelper!.eachMessage(async (payload) => {
    //   //   //     if (payload.previousAttempts > 0) {
    //   //   //       console.log(
    //   //   //         `Retrying message from topic ${payload.originalTopic}`,
    //   //   //       );
    //   //   //     }
    //   //   //     // do something with the message (exceptions will be caught and the
    //   //   //     // message will be sent to the appropriate retry or dead-letter topic)
    //   //   //     await handler(payload);
    //   //   //   }),
    //   //   // });
    //   //   // await this.consumer.run(consumerRunOptions);
    //   // }
    // });
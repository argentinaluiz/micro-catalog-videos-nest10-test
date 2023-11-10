FROM node:20-slim


RUN npm install -g @nestjs/cli@10.1.17
RUN apt update && \
    apt install -y curl && \
    curl -fsSL https://get.docker.com -o get-docker.sh && \
    sh ./get-docker.sh

ARG DOCKER_GROUP_ID

## create group if not exists
RUN groupadd -g ${DOCKER_GROUP_ID} ; exit 0

RUN usermod -aG ${DOCKER_GROUP_ID} node

USER node

WORKDIR /home/node/app

CMD [ "tail", "-f", "/dev/null" ]
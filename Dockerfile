FROM node:20-slim

RUN npm install -g @nestjs/cli@10.1.17

USER node

WORKDIR /home/node/app

CMD [ "tail", "-f", "/dev/null" ]
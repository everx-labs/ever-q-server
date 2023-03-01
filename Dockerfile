FROM node:18-buster

WORKDIR /home/node
USER node
ADD . /home/node
EXPOSE 4000

ENTRYPOINT ["node", "index.js"]

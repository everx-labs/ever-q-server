FROM node:18.20.4-bookworm

WORKDIR /home/node
USER node
ADD . /home/node
EXPOSE 4000

ENTRYPOINT ["node", "index.js"]

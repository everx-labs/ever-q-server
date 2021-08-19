FROM node:14-buster
WORKDIR /home/node
USER node
ADD . /home/node
EXPOSE 4000
ENTRYPOINT ["node", "--trace_gc", "index.js"]

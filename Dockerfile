FROM node:20-bookworm-slim

COPY --chown=node:node ./app /app
COPY --chown=node:node ./external /external

WORKDIR /app
USER node

RUN npm ci
EXPOSE 8080

CMD ["node", "./server.js"]
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache tzdata

ENV TZ=America/Mexico_City

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
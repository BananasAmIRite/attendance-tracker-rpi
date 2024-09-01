FROM node:20.5.0-slim

COPY package*.json .

RUN npm install

COPY . .

EXPOSE 3000

RUN npm run build

RUN npm install -g serve

CMD ["npx", "serve", "build"]
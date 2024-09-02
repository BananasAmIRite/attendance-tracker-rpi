FROM node:20.5.0-slim

RUN apt-get update || : && apt-get install python3 python3-pip -y

COPY package*.json .

RUN npm install

COPY . .

RUN npx prisma db push

RUN npx prisma generate

RUN python3 -m pip install mfrc522-python --break-system-packages

EXPOSE 8080

RUN npm run build

CMD ["npm", "run", "start"]
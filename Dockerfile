FROM 190594267513.dkr.ecr.ap-northeast-2.amazonaws.com/node:latest

WORKDIR /home/app
COPY package*.json ./
RUN npm install

COPY . .

CMD node index.js

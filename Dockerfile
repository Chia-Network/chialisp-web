FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

RUN ./node_modules/yarn/bin/yarn

CMD [ "yarn", "start" ]

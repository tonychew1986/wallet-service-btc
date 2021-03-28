# docker build -t btc-wallet-svc-img .
# docker run --rm -d -p 3005:3005 --name btc-wallet-sever btc-wallet-svc-img
FROM node:12

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3005
CMD [ "node", "index.js" ]
# CMD [ "node", "index.js", "--host", "0.0.0.0"]


# FROM node:lts-alpine
FROM node:lts-alpine 

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV ENV=production

WORKDIR /usr/src/app

# copy both 'package.json' and 'package-lock.json' (if available)
# ... the asterisk is for the wild card name feature
COPY package*.json ./

# install project dependencies
RUN npm install

# copy project files and folders to the current working directory (i.e. 'app' folder)
COPY . .

EXPOSE 5443

CMD [ "node", "index.js" ]


# FROM node:lts-alpine
FROM node:lts-alpine 

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV ENV=production

WORKDIR /usr/src/app

RUN mkdir -p /modules
RUN mkdir -p /db/uploads
RUN mkdir -p /etc/letsencrypt/live/weskool.team
COPY package*.json /etc/letsencrypt/live/weskool.team

# copy both 'package.json' and 'package-lock.json' (if available)
# ... the asterisk is for the wild card name feature
COPY package*.json ./

# install project dependencies
RUN npm install

# copy project files and folders to the current working directory (i.e. 'app' folder)
COPY . .



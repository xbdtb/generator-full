FROM node:8
MAINTAINER xbdtb <xbdtb@163.com>
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
ENV SERVER_PORT 80
EXPOSE 80
RUN npm set registry https://registry.npm.taobao.org
ADD package.json /usr/src/app/
ADD package-lock.json /usr/src/app/
ADD .npmrc /usr/src/app/
RUN npm install
ADD . /usr/src/app/
RUN npm run tsc
CMD ["npm", "run", "start:release"]


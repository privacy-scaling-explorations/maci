FROM node:10.16.3-jessie

COPY . /maci

WORKDIR /maci

RUN yarn install

# RUN yarn circuit:compile
# RUN yarn circuit:setup
# RUN yarn circuit:generatewitness

ENTRYPOINT [ "/bin/bash", "-c", "yarn start" ]
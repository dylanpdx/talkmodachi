########## Build Environment ##########
FROM python:3.10.16-alpine3.21 AS builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apk update && apk add --no-cache \
    build-base \
    clang \
    clang-extra-tools \
    cmake \
    git \
    jack \
    openssl-dev \
    libx11-dev \
    libxext-dev \
    xorg-server-dev

WORKDIR /src
RUN git clone --recursive https://github.com/dylanpdx/citra.git .

# Build Citra
RUN mkdir build && \
    cd build && \
    cmake ../ -DSDL_RENDER=ON -DENABLE_TESTS=OFF -DENABLE_DEDICATED_ROOM=OFF -DENABLE_QT=OFF -DENABLE_WEB_SERVICE=OFF -DENABLE_OPENAL=OFF -DENABLE_OPENGL=OFF -DENABLE_VULKAN=OFF -DENABLE_LIBUSB=OFF -DCITRA_ENABLE_BUNDLE_TARGET=OFF -DENABLE_LTO=OFF -DCITRA_WARNINGS_AS_ERRORS=OFF && \
    cmake --build . -- -j$(nproc)


########## Serverless Target (Lambda) ##########

FROM gradle:jdk17 AS miitomo_build
RUN mkdir /app
WORKDIR /app

COPY talkmodachi-miitomo/ /app/talkmodachi-miitomo/

WORKDIR /app/talkmodachi-miitomo

RUN gradle shadowJar

########## API ##########

FROM python:3.10.16-alpine3.21

RUN mkdir /app
WORKDIR /app

COPY ./api/requirements.txt /app

RUN pip3 install -r requirements.txt --break-system-packages && pip3 install gunicorn --break-system-packages

RUN apk update && apk add --no-cache \
    libstdc++ openjdk17

COPY ./api/*.py /app

COPY --from=builder /src/build/bin/Release /usr/local/bin

RUN mkdir /config
COPY ./api/sdl2-config.ini /config/sdl2-config.ini

# Miitomo
COPY --from=miitomo_build /app/talkmodachi-miitomo/build/libs/talkmodachi-miitomo-1.0-SNAPSHOT-all.jar talkmodachi-miitomo.jar


ENTRYPOINT ["gunicorn", "-b","0.0.0.0:5000","-w","32","main:app", "--access-logfile","-","--error-logfile","-"]
#ENTRYPOINT [ "sh" ]
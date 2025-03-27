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
RUN git clone --recursive https://github.com/PabloMK7/citra.git .

# Build Citra
RUN mkdir build && \
    cd build && \
    cmake ../ -DSDL_RENDER=ON -DENABLE_TESTS=OFF -DENABLE_DEDICATED_ROOM=OFF -DENABLE_QT=OFF -DENABLE_WEB_SERVICE=OFF -DENABLE_OPENAL=OFF -DENABLE_OPENGL=OFF -DENABLE_VULKAN=OFF -DENABLE_LIBUSB=OFF -DCITRA_ENABLE_BUNDLE_TARGET=OFF -DENABLE_LTO=OFF -DCITRA_WARNINGS_AS_ERRORS=OFF && \
    cmake --build . -- -j$(nproc)


########## Serverless Target (Lambda) ##########

FROM python:3.10.16-alpine3.21 AS lambda_build
RUN mkdir /app
WORKDIR /app

RUN apk update && apk add --no-cache \
    build-base \
    cmake \
    autoconf \
    automake \
    libtool \
    clang \
    clang-extra-tools \
    elfutils-dev

RUN pip3 install awslambdaric --target /app

FROM python:3.10.16-alpine3.21 AS lambda

#debug
#RUN apk add --no-cache curl && mkdir -p /.aws-lambda && curl -Lo /.aws-lambda/aws-lambda-rie https://github.com/aws/aws-lambda-runtime-interface-emulator/releases/latest/download/aws-lambda-rie && chmod +x /.aws-lambda/aws-lambda-rie

RUN mkdir /app
WORKDIR /app

COPY --from=lambda_build /app /app

COPY requirements.txt /app
RUN pip3 install -r requirements.txt --break-system-packages 

RUN apk update && apk add --no-cache \
    libstdc++ \
    ffmpeg \
    curl

COPY *.py /app

COPY --from=builder /src/build/bin/Release /usr/local/bin

RUN mkdir /root/.config && mkdir /root/.config/citra-emu
COPY sdl2-config.ini /root/.config/citra-emu/sdl2-config.ini

# Set runtime interface client as default command for the container runtime
ENTRYPOINT [ "/usr/local/bin/python", "-m", "awslambdaric" ]
CMD [ "lambda.handler" ]

########## API ##########

FROM python:3.10.16-alpine3.21

RUN mkdir /app
WORKDIR /app

COPY requirements.txt /app

RUN pip3 install -r requirements.txt --break-system-packages && pip3 install gunicorn --break-system-packages

RUN apk update && apk add --no-cache \
    libstdc++

COPY *.py /app

COPY --from=builder /src/build/bin/Release /usr/local/bin

RUN mkdir /config
COPY sdl2-config.ini /config/sdl2-config.ini

ENTRYPOINT ["gunicorn", "-b","0.0.0.0:5000","-w","8","main:app"]
#ENTRYPOINT [ "sh" ]
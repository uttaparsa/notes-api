# pull official base image
FROM python:3.8-buster

# set work directory
WORKDIR /usr/src/app

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

#RUN apk update  && apk add --virtual build-deps gcc python3-dev musl-dev && apk add jpeg-dev zlib-dev libjpeg
#RUN apk update \
 #   && apk add --virtual build-deps gcc python3-dev musl-dev \
  #  && apk add postgresql \
   # && apk add postgresql-dev \
   # && pip install psycopg2 \
  #  && apk add jpeg-dev zlib-dev libjpeg \
 #   && pip install Pillow \
  #  && apk del build-deps

#RUN apk add zlib-dev jpeg-dev gcc musl-dev

#RUN mkdir /usr/src/app
COPY ./requirements.txt /usr/src/app

WORKDIR /usr/src/app

RUN pip install --proxy http://192.168.1.2:8888 --default-timeout=100 -r requirements.txt

COPY . .

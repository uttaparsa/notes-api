# pull official base image
FROM python:3.12-bookworm

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1


# RUN apk add --no-cache libc6-compat

# RUN apk update \
#     && apk add --virtual  libc6-compat build-deps gcc python3-dev musl-dev \
#     && apk add jpeg-dev zlib-dev libjpeg \
#     && pip install Pillow \
#     && apk del build-deps



RUN mkdir /usr/src/app

COPY ./requirements.txt /usr/src/app

WORKDIR /usr/src/app


RUN pip install -r requirements.txt

COPY . .

COPY entrypoint.sh /usr/src/app/entrypoint.sh
RUN chmod +x /usr/src/app/entrypoint.sh

ENTRYPOINT ["/usr/src/app/entrypoint.sh"]

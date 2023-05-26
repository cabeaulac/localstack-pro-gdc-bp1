FROM lambci/lambda:build-python3.8

ENV LAMBDA_HOME=/usr/local/lhome
ARG HANDLER_NAME=handler
RUN mkdir -p ${LAMBDA_HOME}/src


WORKDIR ${LAMBDA_HOME}
COPY src dist

WORKDIR ${LAMBDA_HOME}/dist
RUN zip  -r ../${HANDLER_NAME}.zip * -x "*.txt"


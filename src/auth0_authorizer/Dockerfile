FROM lambci/lambda:build-python3.8

ENV LAMBDA_HOME=/usr/local/lhome
ARG HANDLER_NAME=handler
RUN mkdir -p ${LAMBDA_HOME}/src

WORKDIR ${LAMBDA_HOME}/dist
#
# Only do this if you have requirements.txt
#
COPY src/requirements-binary.txt requirements-binary.txt
# Include nativ libraries
# Python runtime version --python 3.9
RUN pip install --target $LAMBDA_HOME/package2 \
    --platform manylinux2010_x86_64 \
    --implementation cp \
    --python 3.9 \
    --only-binary=:all: \
    --upgrade \
    -r requirements-binary.txt
# Some dependencies bring boto3 in but the Lambda runtimes includes it already, so delete it from the Lambda zipfile
RUN rm -rf $LAMBDA_HOME/package2/boto*

WORKDIR $LAMBDA_HOME
COPY src dist

WORKDIR ${LAMBDA_HOME}/dist
RUN zip  -r ../${HANDLER_NAME}.zip * -x "*.txt"

WORKDIR $LAMBDA_HOME/package2
RUN zip -ur ../${HANDLER_NAME}.zip .

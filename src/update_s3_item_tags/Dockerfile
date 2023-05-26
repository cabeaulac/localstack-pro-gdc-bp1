FROM lambci/lambda:build-python3.8

ENV LAMBDA_HOME=/usr/local/lhome
ARG HANDLER_NAME=handler
RUN mkdir -p ${LAMBDA_HOME}/src

#WORKDIR ${LAMBDA_HOME}/dist
#
# Only do this if you have requirements.txt
#
#COPY src/requirements.txt requirements.txt
#RUN pip install --target ${LAMBDA_HOME}/package2 -r requirements.txt
## Some dependencies bring boto3 in but the Lambda runtimes includes it already, so delete it from the Lambda zipfile
#RUN rm -rf ${LAMBDA_HOME}/package2/boto*
#RUN rm -rf ${LAMBDA_HOME}/package2/simplejson/tests*

WORKDIR ${LAMBDA_HOME}
COPY src dist

WORKDIR ${LAMBDA_HOME}/dist
RUN zip  -r ../${HANDLER_NAME}.zip * -x "*.txt"

#WORKDIR ${LAMBDA_HOME}/package2
#RUN zip -ur ../${HANDLER_NAME}.zip .

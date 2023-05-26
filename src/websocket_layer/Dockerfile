FROM lambci/lambda:build-python3.8

ENV HOME_DIR=/usr/local/layer
RUN mkdir -p ${HOME_DIR}
WORKDIR ${HOME_DIR}

#COPY src/requirements.txt .
#COPY src/requirements-binary.txt .

#RUN pip install --target ${HOME_DIR}/python -r requirements.txt
#RUN pip install --target ${HOME_DIR}/python \
#    --platform manylinux2010_x86_64 \
#    --implementation cp \
#    --python 3.9 \
#    --only-binary=:all: \
#    --upgrade \
#    -r requirements-binary.txt

# Some dependencies bring boto3 in but the Lambda runtimes includes it already, so delete it from the Lambda zipfile
RUN rm -rf ${HOME_DIR}/python/boto*
RUN rm -rf ${HOME_DIR}/python/simplejson/tests*

COPY build/lib ./python/lib
RUN zip -rq layer.zip ./ -x "*.txt"

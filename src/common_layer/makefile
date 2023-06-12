NEW_CKSUM := $(shell md5sum src/* ../lib/*.py ../docker/Dockerfile.layer ../docker/makefile.layer ./makefile 2>/dev/null| md5sum | cut -f1 -d' ')

-include ../docker/makefile.layer

assemble:
	cp -R ../lib/*.py build/lib
	rm -rf build/lib/rds
	cp -R src build


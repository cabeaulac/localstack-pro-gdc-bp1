NEW_CKSUM := $(shell md5sum src/* ../lib/websocket/* ../docker/Dockerfile.layer ../docker/makefile.layer ./makefile 2>/dev/null| md5sum | cut -f1 -d' ')

-include ../docker/makefile.layer

assemble:
	cp -R ../lib/websocket build/lib
	mkdir -p src


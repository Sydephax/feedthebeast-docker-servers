FROM ubuntu:16.04

RUN apt-get -q update && \
	apt-get -q install -y wget unzip openjdk-8-jre

RUN useradd minecraft -m -s /bin/bash

WORKDIR /usr/local
RUN wget -nv http://mcmyadmin.com/Downloads/etc.zip && \
	unzip etc.zip && \
	rm etc.zip

COPY McMyAdmin.conf /home/minecraft/mcmyadmin/
COPY server.properties /home/minecraft/mcmyadmin/Minecraft/server.properties
WORKDIR /home/minecraft/mcmyadmin
RUN wget -nv http://mcmyadmin.com/Downloads/MCMA2_glibc26_2.zip && \
	unzip MCMA2_glibc26_2.zip && \
	rm MCMA2_glibc26_2.zip && \
	mkdir Minecraft && \
	./MCMA2_Linux_x86_64 -nonotice -updateonly

RUN chown -R minecraft:minecraft /home/minecraft

EXPORT 8123
EXPOSE 8080
EXPOSE 25565

USER minecraft

ENTRYPOINT ["/home/minecraft/mcmyadmin/MCMA2_Linux_x86_64"]
CMD ["-setpass", "pass123"]

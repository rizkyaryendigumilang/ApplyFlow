FROM alpine:3.20
ARG PB_VERSION=0.22.57
ARG PB_ARCH=linux_amd64
ARG PB_SHA256=C1192FFBB40F8C82E5CBAB42D9F6385BE149870A1CF185C7585BF9B3D648D1D8
RUN apk add --no-cache ca-certificates unzip curl wget su-exec && addgroup -S pb && adduser -S -G pb pb && mkdir -p /pb/pb_data && chown -R pb:pb /pb
RUN curl -fsSL https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_${PB_ARCH}.zip -o /tmp/pb.zip && echo "${PB_SHA256}  /tmp/pb.zip" | sha256sum -c - && unzip /tmp/pb.zip -d /pb && rm /tmp/pb.zip && chown pb:pb /pb/pocketbase
COPY --chown=pb:pb pb_schema.json /pb/pb_schema.json
COPY --chown=pb:pb pb_hooks /pb/pb_hooks
COPY --chown=pb:pb pb_migrations /pb/pb_migrations
COPY entrypoint.sh /pb/entrypoint.sh
RUN chmod 755 /pb/entrypoint.sh
WORKDIR /pb
EXPOSE 8090
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 CMD wget -q -O - http://127.0.0.1:8090/api/health || exit 1
ENTRYPOINT ["/pb/entrypoint.sh"]

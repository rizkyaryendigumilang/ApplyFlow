#!/bin/sh
set -eu

PB_UID="$(id -u pb)"
if [ "$(stat -c '%u' /pb/pb_data)" != "$PB_UID" ]; then
  chown -R pb:pb /pb/pb_data
fi

exec su-exec pb /pb/pocketbase serve --http=0.0.0.0:8090

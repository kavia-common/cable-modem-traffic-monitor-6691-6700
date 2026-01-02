#!/bin/bash
cd /home/kavia/workspace/code-generation/cable-modem-traffic-monitor-6691-6700/traffic_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi


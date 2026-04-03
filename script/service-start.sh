#!/bin/bash

#PROCESS
PROCESS_NAME="TaaS_gov-admin"

PORT=2901 pm2 start npm --name "$PROCESS_NAME" -- start

#!/bin/bash

#PROCESS
PROCESS_NAME="TaaS_gov-admin"

pm2 reload --name "$PROCESS_NAME"

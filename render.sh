#!/bin/bash

pwd=$(pwd)
rsync -av --exclude='.' --exclude='.admin.css.xtzvXo' --exclude='backend/' --exclude='test.html' --exclude='test.css' --exclude='README.md' --exclude='LICENSE' --exclude='.git/' --exclude='assets/' --exclude='.' --exclude="assets/" $(pwd) ~/mnt/nginx/www/

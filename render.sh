#!/bin/bash


rsync -av --exclude='.' --exclude='.admin.css.xtzvXo' --exclude='backend/' --exclude='test.html' --exclude='test.css' --exclude='README.md' --exclude='LICENSE' --exclude='.git/' --exclude='assets/' --exclude='.' --exclude="assets/"   ~/PROJETS/siteListe/siteBDS/siteBDS/ ~/mnt/nginx/www/

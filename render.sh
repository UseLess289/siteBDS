#!/bin/bash


if [ $# > 0 ];then
    for x in $@; do
        cp -vr $x ~/mnt/nginx/www/
        exit 0
    done
fi
files=$(find . -name '*.js' -not -path '*/backend/*' && find . -name '*.html' -not -path '*/backend/*' && find . -name '*.css' -not -path '*/backend/*')

for f in $files;do
    cp -vr $f ~/mnt/nginx/www/ 
done

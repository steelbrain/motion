#!/bin/sh

git pull --rebase

if [ $# -eq 0 ]; then
  echo 'Please specify package to release'
  exit 0
fi

cd packages/$1
npm version patch
npm publish
#!/bin/sh
set -e

for f in packages/*; do
  if [ -f "$f/webpack.config.js" ]; then
    cd $f
    for file in webpack.config*; do
      node node_modules/webpack/bin/webpack --config $file $1 &
      echo "running webpack for config $file"
    done
    cd ../..
  elif [ -d "$f/src" ]; then
    echo "running babel on $f"
    node node_modules/babel/bin/babel "$f/src" --out-dir "$f/lib" --copy-files $1 &
  fi
done

wait

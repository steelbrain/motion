#!/bin/bash

set -e

# kill bg tasks on exit
trap 'kill $(jobs -pr)' SIGINT SIGTERM

# order important so they build for each other
packages=("nice-styles" "transform" "flint.js" "flint")

# build
for p in "${packages[@]}"; do
  f="packages/$p"

  # webpack packages
  if [ -f "$f/webpack.config.js" ]; then
    cd $f
    node ../../node_modules/webpack/bin/webpack --config webpack.config.js $1 &
    echo "running $f webpack for $f"
    cd ../..
  # or just babel
  elif [ -d "$f/src" ]; then
    echo "running babel on $f"

    node ./node_modules/babel/bin/babel "$f/src" --out-dir "$f/lib" \
      --stage 0 \
      --loose all \
      --optional asyncToGenerator \
      --blacklist es6.tailCall \
      --blacklist strict \
      --copy-files $1 &
  fi
done

if [ "$1" = "--watch" ]; then
  # watch tools after first build
  if [ "$2" != '--notools' ]; then
    sleep 4
    cd apps/tools
    flint build --watch --nomin &
    cd ../..
  fi
fi

# wait for bg tasks

FAIL=0

for job in `jobs -p`
do
  wait $job || let "FAIL+=1"
done

if [ "$FAIL" == "0" ]; then
  exit 0
else
  exit 1
fi

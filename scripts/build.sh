#!/bin/bash

set -e

# kill bg tasks on exit
trap 'kill $(jobs -pr)' SIGINT SIGTERM

# order important so they build for each other
if [ "$PACKAGE_NAME" != "" ]; then
  packages=$PACKAGE_NAME
else
  packages=("fs" "nice-styles" "transform" "client" "motion" "npm" "webpack-npm")
fi

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

    node ./node_modules/babel-cli/bin/babel "$f/src" \
      --out-dir "$f/lib" \
      --presets es2015-node4,stage-2 \
      --plugins transform-async-to-generator,transform-flow-strip-types,syntax-flow \
      --source-maps \
      --copy-files $1 &
  fi
done

if [ "$1" = "--watch" ]; then
  # watch tools after first build
  if [ "$2" != '--notools' ]; then
    sleep 4
    cd apps/tools
    motion build --watch --nomin &
    cd ../..
  fi

  # relink cli automatically
  chsum1=""
  cd packages/motion
  npm link --loglevel=error --no-progress
  cd ../..

  # this is expensive
  # while true; do
  #   sleep 20
  #   (cd packages/client && node prepublish)
  # done
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

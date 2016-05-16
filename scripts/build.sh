#!/bin/bash

ROOT_DIRECTORY=$( cd $(dirname $0)/.. ; pwd -P )
export PATH=${ROOT_DIRECTORY}/node_modules/.bin:$PATH

set -e

# kill bg tasks on exit
trap 'kill $(jobs -pr)' SIGINT SIGTERM

# order important so they build for each other
if [ "$PACKAGE_NAME" != "" ]; then
  packages=$PACKAGE_NAME
else
  . ${ROOT_DIRECTORY}/scripts/__variables.sh
  packages=${PACKAGE_NAMES}
fi

# build
for p in $packages; do
  f="packages/$p"

  # webpack packages
  if [ -f "$f/webpack.config.js" ]; then
    cd $f
    webpack --config webpack.config.js $1 &
    echo "running $f webpack for $f"
    cd ../..
  # or just babel
  elif [ -d "$f/src" ]; then
    echo "running babel on $f"

    babel "$f/src" \
      --out-dir "$f/lib" \
      --presets react,es2015-sane,stage-0 \
      --plugins transform-async-to-generator,transform-flow-strip-types,syntax-flow \
      --source-maps \
      --copy-files $1 &
  fi
done

if [ "$1" = "--watch" ]; then
  # relink cli automatically
  chsum1=""
  cd packages/motion
  npm link --loglevel=error --no-progress
  cd ../..
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

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
  # relink cli
  echo "Watch CLI for relink"
  chsum1=""
  cd packages/flint

  sleep 1
  hasLinkedOnce='false'
  while [[ true ]]
  do
    if [ -d 'lib' ]; then
      chsum2=`find lib -type f -exec md5 {} \;`
      if [[ $chsum1 != $chsum2 ]] ; then
        npm link --loglevel=error
        chsum1=$chsum2
        hasLinkedOnce='true'

        # watch tools after first build
        if [ $hasLinkedOnce=='false' ] && [ "$2" != '--notools' ]; then
          sleep 1
          cd ../..
          cd apps/tools
          flint build --watch &
          cd ../..
          cd packages/cli
        fi
      fi
    fi
    sleep 1
  done
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

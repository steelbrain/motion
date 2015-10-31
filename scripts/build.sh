#!/bin/sh

set -e

# kill bg tasks on exit
trap 'kill $(jobs -p)' EXIT

# build
for f in packages/*; do
  # webpack packages
  if [ -f "$f/webpack.config.js" ]; then
    cd $f
    node node_modules/webpack/bin/webpack --config webpack.config.js $1 &
    echo "running $f webpack for $file"
    cd ../..
  # or just babel
  elif [ -d "$f/src" ]; then
    echo "running babel on $f"

    node node_modules/babel/bin/babel "$f/src" --out-dir "$f/lib/compat" \
      --stage 0 \
      --loose all \
      --blacklist es6.tailCall \
      --optional runtime \
      --copy-files $1 &

    node node_modules/babel/bin/babel "$f/src" --out-dir "$f/lib/modern" \
      --stage 0 \
      --loose all \
      --optional asyncToGenerator \
      --blacklist es6.tailCall \
      --copy-files $1 &
  fi
done

# extra stuff for watch
if [ $1="--watch" ]; then
  # relink cli
  echo "Watch CLI for relink"
  chsum1=""
  cd packages/cli

  sleep 2
  hasLinkedOnce='false'
  while [[ true ]]
  do
    if [ -d 'lib' ]; then
      chsum2=`find lib -type f -exec md5 {} \;`
      if [[ $chsum1 != $chsum2 ]] ; then
        npm link --loglevel=error
        chsum1=$chsum2

        # watch tools after first build
        if [ $hasLinkedOnce == 'false' ]; then
          sleep 2 # todo: wait for webpack finish
          cd ../..
          cd apps/tools
          flint build --watch &
          cd ../..
          cd packages/cli
        fi

        hasLinkedOnce='true'
      fi
    fi
    sleep 1
  done
fi

wait
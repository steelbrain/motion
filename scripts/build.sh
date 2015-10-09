#!/bin/sh

set -e
trap 'kill $(jobs -p)' EXIT

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
    node node_modules/babel/bin/babel "$f/src" --out-dir "$f/lib" \
      --stage 0 \
      --loose all \
      --blacklist es6.tailCall \
      --optional runtime \
      --copy-files $1 &
  fi
done

# watch also runs the builds above
if [ $1="--watch" ]; then
  # Relink CLI watcher
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
        npm link
        chsum1=$chsum2

        # build tools after first build
        if [ $hasLinkedOnce == 'false' ]; then
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
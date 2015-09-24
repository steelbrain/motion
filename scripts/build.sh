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

if [ $1="--watch" ]; then
  echo "Watching CLI for relink"
  chsum1=""
  cd packages/cli

  sleep 2
  while [[ true ]]
  do
      chsum2=`find lib -type f -exec md5 {} \;`
      if [[ $chsum1 != $chsum2 ]] ; then
          npm link
          chsum1=$chsum2
      fi
      sleep 2
  done
fi

wait

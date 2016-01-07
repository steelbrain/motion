#!/bin/sh

if [ $# -eq 0 ]; then
  echo 'Please specify package to release'
  exit 0
fi

release_package() {
  cd $1
  echo $1

  if [ -f "webpack.config.release.js" ]; then
    node node_modules/webpack/bin/webpack --config webpack.config.release.js
    echo "building webpack"
  fi

  # VERSION=$(npm view flint version -loglevel silent)
  # git tag -a "v$VERSION" -m "`git log -1 --format=%s`"
  npm publish --tag=latest
  cd ../..
}

release_tools() {
  echo "Tools"
  cd apps/tools/.flint
	npm publish --tag=latest
  cd ../../..
}

release_all() {
  for pkg in packages/*; do
    [ -d "${pkg}" ] || continue # if not a directory, skip
    release_package ${pkg}
  done
  release_tools
}

if [ $1 = "all" ]; then
  release_all
elif [ $1 = "tools" ]; then
  release_tools
else
  release_package packages/$1
fi
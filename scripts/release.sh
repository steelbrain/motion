#!/bin/sh

if [ $# -eq 0 ]; then
  echo 'Please specify package to release'
  exit 0
fi

release_package() {
  cd packages/$1
  npm version patch
  npm publish
  cd ../..
}

release_tools() {
  cd apps/$1/.flint
	npm version patch
	npm publish
  cd ../..
}

release_all() {
  for pkg in packages/*; do
    [ -d "${pkg}" ] || continue # if not a directory, skip
    release_package ${pkg}
  done
  release_tools
}

commit_update() {
  git commit -am "npm publish"

}

if [ $1 = "all" ]; then
  release_all
elif [ $1 = "tools" ]; then
  relase_tools
else
  release_package $1
fi

# git commit -am 'vbump'
# git push origin head
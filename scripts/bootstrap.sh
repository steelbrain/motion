#!/usr/bin/env bash

printf "HEY! LISTEN!\nPUT THIS IN YOUR SHELL TO GET DEBUGS:\n"
printf 'export MOTION_DEBUG="true"'
printf "\n\n"

# Unlink previously installed packages
NPM_PREFIX=$(npm get prefix)
rm -rf "$NPM_PREFIX"/bin/motion*
rm -rf "$NPM_PREFIX"/lib/node_modules/motion*

ROOT_DIRECTORY=$( cd $(dirname $0)/.. ; pwd -P )
PACKAGES_PATH=${ROOT_DIRECTORY}/packages
PACKAGE_EXTRACTION_FILE="${ROOT_DIRECTORY}/scripts/_read_dependencies.js"
# NOTE: Order is important
PACKAGES_TO_LINK=(  "babel-preset" "fs" "runtime" "transform" "nice-styles" "motion" "style" )
NPM_ROOT=$( npm root -g )

for name in "${PACKAGES_TO_LINK[@]}"
do :
  cd ${PACKAGES_PATH}/${name}

  printf "Pruning in "${name}"\n"
  npm prune 1>/dev/null 2>/dev/null
  mkdir -p node_modules
  find node_modules -name "motion-*" -exec rm -r "{}" \;

  printf "Linking in other packages\n"
  manifest_contents=$(cat package.json)
  dependencies=$(printf "${manifest_contents#*dependencies}" | grep -E "motion.*?\": " | perl -pe 's|"(\S+)":.*|\1|')
  for dependency in ${dependencies}
  do :
    printf "Linking "${dependency}" in "${name}"\n"
    npm link ${dependency} --loglevel=error
  done

  printf "Installing dependencies\n"
  # to install devDependencies in packages
  npm install --development

  printf "Linking self\n"
  npm link --loglevel=error

  if [ -f "prepublish.js" ]; then
    node prepublish.js
  fi

  printf "\n"
done

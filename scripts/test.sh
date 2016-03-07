#!/usr/bin/env bash

# Usage:
# To run specs in all packages do `./test.sh`
# To run specs in a specific package named 'fs' do `SPEC_PACKAGE=fs ./test.sh`

ROOT_DIRECTORY=$( cd $(dirname $0) ; pwd -P )/..
PACKAGES_PATH=${ROOT_DIRECTORY}/packages
PACKAGES_WITH_SPECS=$SPEC_PACKAGE || ( "npm" "motion" "fs" )

# Helper script that specs are going to require
export SPEC_HELPER_SCRIPT=${ROOT_DIRECTORY}/spec/helpers.js

for name in "${PACKAGES_WITH_SPECS[@]}"
do :
  ( cd ${PACKAGES_PATH}/${name} ; apm test )
done

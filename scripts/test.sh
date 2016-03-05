#!/usr/bin/env bash

#
# This is our helper script that's gonna execute specs in all of our packages for us
#

ROOT_DIRECTORY=$( cd $(dirname $0) ; pwd -P )/..
PACKAGES_PATH=${ROOT_DIRECTORY}/packages
PACKAGES_WITH_SPECS=( "npm" "motion" )

# Helper script that specs are going to require
export SPEC_HELPER_SCRIPT=${ROOT_DIRECTORY}/spec/helpers.js

for name in "${PACKAGES_WITH_SPECS[@]}"
do :
  ( cd ${PACKAGES_PATH}/${name} ; apm test )
done

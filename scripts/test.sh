#!/usr/bin/env bash

#
# This is our helper script that's gonna execute specs in all of our packages for us
#

PACKAGES_PATH=$( cd $(dirname $0) ; pwd -P )/../packages/
PACKAGES_WITH_SPECS=( "npm" )

for name in "${PACKAGES_WITH_SPECS[@]}"
do :
  ( cd $PACKAGES_PATH/$name ; apm test )
done

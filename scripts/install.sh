#!/bin/sh


# Welcome to the Flint install script!
# To run this, open your terminal and type:
#
#    curl https://flintjs.com/install.sh | sh


# (wrapped with function to execute only if fully downloaded)
do_install () {

echo

USER=$(whoami)
NODE_MODULES="/usr/local/lib/node_modules"

set -e
set -u

BOLD=$(tput bold)
NORMAL=$(tput sgr0)
GREEN='\033[01;32m'
RED='\033[01;31m'
NONE='\033[00m'

echo_good() {
  echo "${GREEN}${BOLD}$1${NONE}${NORMAL}"
}

echo_bad() {
  echo "${RED}${BOLD}$1${NONE}${NORMAL}"
}

echo_error() {
cat <<"EOF"

  Open an issue at:
    https://github.com/flintjs/flint/issues

  Or join our Slack:
    http://flint-slack.herokuapp.com

EOF
}

# Let's display everything on stderr.
exec 1>&2

# Check npm exists
if hash npm 2>/dev/null; then
  echo_good "Checking node/npm... ✓"
else
cat <<"EOF"

  You don't have npm!

  Download: https://nodejs.org

  And re-run!

EOF
  exit 1
fi

# Check sudo privelege on global node_modules
if [ -w $NODE_MODULES ]; then
  echo_good "Checking global node_modules permissions... ✓"
  echo
  echo "Installing Flint..."
  echo
  npm install -g flint
else
  #
cat <<"EOF"

  Your global npm modules are owned by sudo!

  This will cause Flint to create new apps more slowly
  (and it won't work offline).

EOF
  #
  read -p "Would you like us to try to fix npm permissions [y/n]? " -n 1 -r
  echo

  # if wanted to fix
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo shown -R $USER ~/.npm
    sudo chown -R $USER /usr/local/lib/node_modules

    # if fixed
    if [ -w $NODE_MODULES ]; then
      echo
      echo_good "Node modules permissions fixed ✓"
      echo
      echo "Installing flint..."
      echo
      sleep 1
      npm install -g flint
    else
      echo
      echo_bad "Uh oh! Couldn't fix permissions!"
      echo_error
      exit 1
    fi
  # else not wanted to fix
  else
    #
cat <<"EOF"

  Not fixing npm permissions!

  If you want to do this later, run:

    $ sudo shown -R $(whoami) ~/.npm
    $ sudo chown -R $(whoami) /usr/local/lib/node_modules

  This would avoid sudo for commands like `npm install -g xyz`

EOF
    #
    sleep 2
    echo
    echo "Installing flint with sudo..."
    echo
    sleep 1
    sudo npm install -g flint
  fi
fi

if hash flint 2>/dev/null; then
  #
  echo
  echo_good "Flint has been installed!"
cat <<"EOF"

  Run Flint with:

    $ flint new appname
    $ cd appname
    $ flint

  Docs at http://flintjs.com/docs

EOF
  #
else
  #
  echo
  echo_bad "Flint not installed!"
  echo_error
  #
fi

trap - EXIT

}

# Run
do_install
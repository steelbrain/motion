#!/bin/sh


# Welcome to the Motion install script!
# To run this, open your terminal and type:
#
#    sh <(curl -L https://motion.love)


# (wrapped with function to execute only if fully downloaded)
do_install () {

echo

NODE_MODULES=$(npm root -g)
NODE_MODULES_BIN=$(npm bin -g)

# This was breaking `read` :(
# set -e
# set -u

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

echo_bold() {
  echo "${BOLD}$1${NORMAL}"
}

echo_error() {
cat <<"EOF"

  Open an issue at:
    https://github.com/motionjs/motion/issues

  Or join our Slack:
    http://motion-slack.herokuapp.com

EOF
}

# Let's display everything on stderr.
exec 1>&2

# Check git exists
if hash git 2>/dev/null; then
  echo_good "Checking git... ✓"
else
cat <<"EOF"

  You don't have git! You must have a new machine...

  Install git then re-run this script.

EOF
  exit 1
fi

# Check npm exists
if hash npm 2>/dev/null; then
  echo_good "Checking node/npm... ✓"
else
cat <<"EOF"

  You don't have npm!

  Download: https://nodejs.org

  Then re-run this script.

EOF
  exit 1
fi

# atom beta plugin
# echo
# read -p "Would you like to install the atom plugin [y/n]? " reply
# echo
# if [[ "$reply" =~ ^[Yy]$ ]]; then
#   sudo rm -r ~/.atom/packages/motion
#   git clone -b beta http://github.com/motionjs/atom ~/.atom/packages/motion
#   (cd ~/.atom/packages/motion && npm install)
# fi

# Check sudo privelege on global node_modules
if [ -w "$NODE_MODULES" ] && [ -w "$NODE_MODULES_BIN" ]; then
  echo_good "Checking global node_modules permissions... ✓"
  echo
  echo "Installing Motion..."
  echo
  npm install -g motion --loglevel=error --no-progress
else
  #
cat <<"EOF"

  Your global npm modules are owned by sudo!

  This will cause Motion to create new apps more slowly
  (and forces you to use sudo when installing npm globally).

EOF
  echo
  read -p "Would you like us to try and fix npm permissions [y/n]? " reply
  echo

  # if wanted to fix
  if [[ "$reply" =~ ^[Yy]$ ]]; then
    sudo chown -R $(whoami) ~/.npm
    sudo chown -R $(whoami) $NODE_MODULES
    sudo chown -R $(whoami) $NODE_MODULES_BIN

    # if fixed
    if [ -w $NODE_MODULES ]; then
      echo
      echo_good "Node modules permissions fixed ✓"
      echo
      echo "Installing motion..."
      echo
      npm install -g motion --loglevel=error --no-progress
    else
      echo
      echo_bad "Uh oh! Couldn't fix permissions!"
      echo "  (You can install without sudo, just run this script again)"
      echo_error
      exit 1
    fi
  # else not wanted to fix
  else
    #
cat <<"EOF"

  Not fixing npm permissions!

  If you want to do this later, run:

    $ sudo chown -R $(whoami) ~/.npm
    $ sudo chown -R $(whoami) /usr/local/lib/node_modules

  This would avoid sudo for commands like `npm install -g xyz`

EOF
    #
    sleep 2
    echo
    echo "Installing motion with sudo..."
    echo
    sudo npm install -g motion --loglevel=error --no-progress
  fi
fi

if hash motion 2>/dev/null; then
  echo
  if [ -z "$EDITOR" ]; then
    echo_bold "No EDITOR set in your shell"
    echo "Motion helps open your editor if you set your EDITOR shell variable"
  else
    echo_bold "Your default editor is set to $EDITOR"
  fi

  echo
  echo_good "Motion has been installed!"
  #
cat <<"EOF"

  Run Motion with:

    $ motion new appname
    $ cd appname
    $ motion

  Docs at http://motionjs.com/docs

EOF
  #
else
  #
  echo
  echo_bad "Motion not installed!"
  echo_error
  #
fi

trap - EXIT

}

# Run
do_install

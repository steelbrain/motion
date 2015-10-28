
  try {
    window.__flintPackages["react-json-tree"] = require("react-json-tree")
  }
  catch(e) {
    console.log('Error running package!')
    console.error(e)
  };

  try {
    window.__flintPackages["md5-o-matic"] = require("md5-o-matic")
  }
  catch(e) {
    console.log('Error running package!')
    console.error(e)
  };

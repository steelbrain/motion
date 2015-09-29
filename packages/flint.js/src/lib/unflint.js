const replaceViewDef = /Flint.view\(\"([a-zA-Z]*)\".*\{/g ///Flint.view\(\"([^\"]*)([^_]*)/g
const replaceStyles = /view\.style\[\"style([a-z1-9_A-Z]*)\"\] = \(_index\) => false \|\|  {/g

export default msg =>
  msg.replace(replaceViewDef, 'view $1 {')
     .replace(/view\.props\./g, '^')
     //TODO: remove _noreg_
     //cant put two $$s together for some reason
     .replace(replaceStyles, '\$_noreg_$1 = {')
     .replace(/_noreg_/g, '')

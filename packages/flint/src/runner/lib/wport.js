import opts from '../opts'

export default function wport() {
  return 2283 + parseInt(opts('port'), 10)
}

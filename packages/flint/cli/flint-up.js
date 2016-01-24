import Surge from 'surge'
import hooks from './hooks'

var surge = Surge({ platform: 'roguemont.com' })

surge.publish(hooks)
import most from 'most'
import pm from '../../lib/power-most'
import utils from '../../lib/utils'
import {h} from '@motorcycle/dom'
import V from '../view'

function Root({DOM, ROUTER}) {
  return {
    DOM: most.periodic(1000).constant(1).scan((a, c) => a + c, 0).map(i =>
      h('div', [
        V.header(),
        h('a.link', {props: {href: `/123${i}`}}, [`/123${i}`]),
      ])
    ),
    ROUTER: utils.makeCurrentLocation$(DOM),
  }
}


export default Root

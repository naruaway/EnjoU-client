import most from 'most'
import pm from '../../lib/power-most'
import utils from '../../lib/utils'
import {h} from '@motorcycle/dom'
import V from '../view'

function Root({DOM, ROUTER}) {
  function makeLinkElm(href, children) {
    return h('a.link', {props: {href: href}}, children)
  }

  return {
    DOM: most.of(
      h('div', [
        V.header(),
        h('ul', [
          h('li', [makeLinkElm('/channels/1', '1')]),
          h('li', [makeLinkElm('/channels/2', '2')]),
          h('li', [makeLinkElm('/channels/3', '3')]),
          h('li', [makeLinkElm('/channels/4', '4')]),
          h('li', [makeLinkElm('/channels/5', '5')]),
          h('li', [makeLinkElm('/channels/6', '6')]),
        ]),
      ])
    ),
    ROUTER: utils.makeCurrentLocation$(DOM),
  }
}


export default Root

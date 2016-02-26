import most from 'most'
import pm from '../../lib/power-most'
import utils from '../../lib/utils'
import {h} from '@motorcycle/dom'
import V from '../view'
import unilist from './list'

function intent(sources) {
  const {DOM, HTTP} = sources
  return {
    postText$: DOM.select('#post').events('submit').tap(ev => ev.preventDefault())
      .map(ev => {
        const elm = ev.currentTarget.querySelector('#post-text')
        const value = elm.value
        elm.value = ''
        return value.trim()
      }).filter(v => v).multicast(),
    searchResults$: HTTP.switch()
  }
}
function Root(sources) {
  const {DOM} = sources
  const actions = intent(sources)
  actions.searchResults$.observe(o => console.log(JSON.parse(o)))

  function makeLinkElm(href, children) {
    return h('a.link', {props: {href: href}}, children)
  }

  return {
    DOM: most.of(
      h('div', [
        V.header(),
        h('ul.top-list', [
          h('li', [makeLinkElm('/channels/1', '〇〇大学')]),
          h('li', [makeLinkElm('/channels/2', '△大学XX学科')]),
          h('li', [makeLinkElm('/channels/3', '△大学OX学科')]),
          h('li', [makeLinkElm('/channels/4', '△大学XP学科')]),
          h('li', [makeLinkElm('/channels/5', '△大学XE学科')]),
          h('li', [makeLinkElm('/channels/6', '△大学EX学科')]),
        ]),
      ])
    ),
    ROUTER: utils.makeCurrentLocation$(DOM),
  }
}


export default Root

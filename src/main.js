import most from 'most'
import hold from '@most/hold'
import {run} from '@motorcycle/core'
import {makeDOMDriver, h} from '@motorcycle/dom'
import {makeRouterDriver} from '@motorcycle/router'
import {createHistory} from 'history'
import {makeSocketDriver} from './websocket-driver'
import isolate from '@cycle/isolate'
import V from './view'
import _ from 'lodash'
import utils from './lib/utils'
import Chat from './chat'

function root({DOM, ROUTER}) {
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

run(({WS, DOM, ROUTER, initialRoute$}) => {
  const currentComponent$ = hold(ROUTER.define({
    '/': () => isolate(root)({DOM, ROUTER: ROUTER.path('/')}),
    '/:channelId': (channelId) => () => isolate(Chat)({WS, DOM, ROUTER: ROUTER.path('/'), id: channelId}),
  }).value$.map(f => f()))

  const currentVTree$ = currentComponent$.map(({DOM}) => DOM).switch()
  const currentLocation$ = currentComponent$.map(({ROUTER}) => ROUTER).switch()
  const currentWS = currentComponent$.map(({WS}) => WS ? WS : most.empty()).switch()

  return {
    DOM: currentVTree$,
    ROUTER: currentLocation$,
    WS: currentWS,
  }
}, {
  initialRoute$: () => most.of(location.pathname),
  DOM: makeDOMDriver('#app', [
    require(`snabbdom/modules/class`),
    require(`snabbdom/modules/props`),
    require(`snabbdom/modules/attributes`),
    require(`snabbdom/modules/style`),
    require('snabbdom/modules/eventlisteners'),
  ]),
  ROUTER: makeRouterDriver(createHistory()),
  WS: makeSocketDriver(),
})

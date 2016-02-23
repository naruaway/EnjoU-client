import most from 'most'

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
        h('a', {props: {href: `/123${i}`}}, [`/123${i}`]),
      ])
    ),
    ROUTER: utils.makeCurrentLocation$(DOM),
  }
}

run(({WS, DOM, ROUTER, initialRoute$}) => {
  const currentComponent$ = ROUTER.define({
    '/': () => isolate(root)({DOM, ROUTER: ROUTER.path('/')}),
    '/:id': (id) => () => isolate(Chat)({WS, DOM, ROUTER: ROUTER.path('/'), id}),
  }).value$.map(f => f()).multicast()

  const currentVTree$ = currentComponent$.map(({DOM}) => DOM).switch()
  const currentLocation$ = currentComponent$.map(({ROUTER}) => ROUTER).switch()
  const currentWS = currentComponent$.map(({WS}) => WS ? WS : most.empty()).switch()

  return {
    //DOM: most.of(h('div', [h('a', {props: {href: "/some/route"}}, ['/tako/A'])])),
    DOM: currentVTree$,
    ROUTER: currentLocation$.merge(initialRoute$),
    WS: currentWS,
  }
}, {
  initialRoute$: () => most.of(location.pathname),
  DOM: makeDOMDriver('#app'),
  ROUTER: makeRouterDriver(createHistory()),
  WS: makeSocketDriver('http://localhost:8080/'),
})

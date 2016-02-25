import _ from 'lodash'
import most from 'most'
import pm from '../lib/power-most'
import utils from '../lib/utils'
import {run} from '@motorcycle/core'
import isolate from '@cycle/isolate'
import {makeDOMDriver, h} from '@motorcycle/dom'
import {makeRouterDriver} from '@motorcycle/router'
import {createHistory} from 'history'
import {makeSocketDriver} from './drivers/websocket-driver'
import {makeWorkerDriver} from './drivers/webworker-driver'
import V from './view'
import Chat from './pages/chat'
import Root from './pages/root'

const drivers = {
  DOM: makeDOMDriver('#app', [
    require('snabbdom/modules/class'),
    require('snabbdom/modules/props'),
    require('snabbdom/modules/attributes'),
    require('snabbdom/modules/style'),
    require('snabbdom/modules/eventlisteners'),
  ]),
  ROUTER: makeRouterDriver(createHistory()),
  WS: makeSocketDriver(),
  Worker: makeWorkerDriver('/worker.js'),
}

run(sources => {
  const component$ = sources.ROUTER.define({

    '/':
      () => isolate(Root)(sources),

    '/:channelId': (channelId) =>
      () => isolate(Chat)(sources, channelId),

  }).value$.map(f => f())::pm.hold()

  return _.mapValues(drivers, (driver, driverName) =>
    component$.map(sinks => sinks[driverName] ? sinks[driverName] : most.empty()).switch())
}, drivers)

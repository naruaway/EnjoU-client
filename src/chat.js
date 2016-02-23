import most from 'most'
import {h} from '@motorcycle/dom'
import utils from './lib/utils'
import V from './view'


function intent({WS, DOM, ROUTER, id}) {
  return {
    postText$: DOM.select('#post').events('submit').tap(ev => ev.preventDefault())
    .map(ev => {
      const elm = ev.currentTarget.querySelector('#post-text')
      const value = elm.value
      elm.value = ''
      return value
    }).multicast(),
    initialTexts$: WS.get('initial texts'),
    newText$: WS.get('new text').map(({text}) => text),
  }
}

function model(actions) {
  return actions.initialTexts$.map(most.from).switch().merge(actions.newText$).scan((a, text) => [text, ...a], [])
}

function view(state, id) {
  return h('div', [
           V.header(id),
           h('form#post', {props: {action: ''}}, [
             h('input#post-text', {props: {type: 'text', placeholder: 'type here', autocomplete: 'off'}}),
           ]),
           h('div.main', [
             h('div.negative', [
               h('ul', state.map(t => h('li', t))),
             ]),
             h('div.positive', [
               h('ul', [
                 h('li', 'fwae'),
                 h('li', 'すごい'),
                 h('li', 'やばい'),
               ]),
             ]),
           ]),
         ])
}

function Chat({WS, DOM, ROUTER, id}) {
  const actions = intent({WS, DOM, ROUTER, id})
  const state$ = model(actions)
  const VTree$ = state$.map(state => view(state, id))

  const webSocket$ = most.merge(
    actions.postText$.map(text => ({messageType: 'post message', message: text})),
    most.of({messageType: 'join room', message: id})
  )

  return {
    DOM: VTree$,
    ROUTER: utils.makeCurrentLocation$(DOM),
    WS: webSocket$,
  }
}

export default Chat

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
    initialMessages$: WS.get('initial messages'),
    newMessage$: WS.get('new message'),
  }
}

function model(actions) {
  return actions.initialMessages$.map(most.from).switch().merge(actions.newMessage$).scan((a, message) => [message, ...a], [])
  .map(messages => ({
    messages
  }))
}

function view({messages}, id) {
  return h('div', [
           V.header(id),
           h('form#post', {props: {action: ''}}, [
             h('input#post-text', {props: {type: 'text', placeholder: 'type here', autocomplete: 'off'}}),
           ]),
           h('div.main', [
             h('div.messages', [
               h('ul', messages.map(({contents}) => h('li', contents))),
             ]),
           ]),
         ])
}

function Chat({WS, DOM, ROUTER, id}) {
  const channelId = id
  const actions = intent({WS, DOM, ROUTER, id})
  const state$ = model(actions)
  const VTree$ = state$.map(state => view(state, id))

  const webSocket$ = most.merge(
    actions.postText$.map(contents => ({type: 'send', value: {
      eventName: 'post message',
      value: {
        contents,
        score: 0,
        replyTo: [],
      }
    }})),
    most.of({type: 'connect', value: `ws://localhost:8080/api/channel/${channelId}`})
  )

  return {
    DOM: VTree$,
    ROUTER: utils.makeCurrentLocation$(DOM),
    WS: webSocket$,
  }
}

export default Chat

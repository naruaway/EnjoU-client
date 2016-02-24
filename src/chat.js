import most from 'most'
import {h} from '@motorcycle/dom'
import utils from './lib/utils'
import V from './view'
import {segment} from './lib/tiny-segmenter'

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
  console.log('MODEL')
  const messages$ = most.merge(actions.initialMessages$, actions.newMessage$).scan((a, c) => {
    if (a === null) return c
    return (a.push(c), a)
  }, null).skip(1)
  return messages$.map(messages => ({ messages }))
}

function view({messages}, id) {
  function createMessageElm(message) {
    return h('li', {style: {
      color: `rgba(0, ${(message.score + 5) * 50}, 0, 1)`,
    }}, message.contents)
  }

  return h('div', [
           V.header(id),
           h('form#post', {props: {action: ''}}, [
             h('input#post-text', {props: {type: 'text', placeholder: 'type here', autocomplete: 'off'}}),
           ]),
           h('div.main', [
             h('div.messages', [
               h('ul', messages.map(createMessageElm))
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

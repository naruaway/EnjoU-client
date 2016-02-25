import most from 'most'
import {h} from '@motorcycle/dom'
import utils from './lib/utils'
import V from './view'
import _ from 'lodash'
import {segment} from './lib/tiny-segmenter'


function startsWith(target) {
  return this.merge(most.of(target))
}

function intent({WS, DOM, ROUTER, id}) {
  return {
    /*
    clickMessage$: DOM.select('.message').events('click')
      .map(ev => parseInt(ev.currentTarget.dataset.id))
      .tap(messageId => { document.querySelector('#post-text').value += ` @${messageId} ` }),
      */

    postText$: DOM.select('#post').events('submit').tap(ev => ev.preventDefault())
      .map(ev => {
        const elm = ev.currentTarget.querySelector('#post-text')
        const value = elm.value
        elm.value = ''
        return value
      }).multicast(),

    changeText$: DOM.select('#post-text').events('input').map(ev => ev.currentTarget.value),

    initialMessages$: WS.get('initial messages'),

    newMessage$: WS.get('new message'),
  }
}

function model(actions) {
  const selectedMessages$ = actions.changeText$
    .merge(actions.postText$.constant(''))
    .map(text => {
      const m = text.match(/@([1-9][0-9]+|[1-9])/g)
      return new Set((m ? m : []).map(i => parseInt(i.slice(1))))
    }).debounce(500)::startsWith(new Set())

  const messages$ = most.merge(actions.initialMessages$, actions.newMessage$).scan((a, c) => {
    if (a === null) return c
    return [c, ...a]
  }, null).skip(1)

  return most.combineArray((messages, selectedMessages) => (
    {messages, selectedMessages}
  ), [messages$, selectedMessages$])
}

function view({messages, selectedMessages}, id) {
  function createMessageElm(message) {
    return h('li.message', {
      key: message.messageId,
      style: {
        color: `rgba(0, ${(message.score + 5) * 10}, 0, ${selectedMessages.has(message.messageId) ? 1 : 0.4})`,
      },
      attrs: {
        'data-id': message.messageId,
      },
    }
    , [h('span', `${message.messageId} `), h('span.message-contents', message.contents)])
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

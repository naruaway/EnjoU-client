import most from 'most'
import pm from '../../lib/power-most'
import {h} from '@motorcycle/dom'
import utils from '../../lib/utils'
import V from '../view'
import _ from 'lodash'
import chroma from 'chroma-js'
import {segment} from '../../lib/tiny-segmenter'


function getReplyTos(text) {
  let m = text.match(/@([1-9][0-9]+|[1-9])/g)
  m = m ? m : []
  return m.map(i => parseInt(i.slice(1)))
}

function startsWith(target) {
  return this.merge(most.of(target))
}

function intent(sources) {
  const {DOM, WS, Worker} = sources
  return {
    postText$: DOM.select('#post').events('submit').tap(ev => ev.preventDefault())
      .map(ev => {
        const elm = ev.currentTarget.querySelector('#post-text')
        const value = elm.value
        elm.value = ''
        return value.trim()
      }).filter(v => v).multicast(),

    changeText$: DOM.select('#post-text').events('input').map(ev => ev.currentTarget.value)
      .merge(
        DOM.select('span.message-id').events('click')
          .map(ev => parseInt(ev.currentTarget.parentNode.dataset.id))
          .map(messageId => {
            const value = document.querySelector('#post-text').value += ` @${messageId} `
            document.querySelector('#post-text').focus()
            return value
          })
      )::pm.hold(),

    clickMessage$: DOM.select('span.message-contents').events('click')
      .map(ev => parseInt(ev.currentTarget.parentNode.dataset.id)),

    clickHeader$: DOM.select('header.header').events('click'),

    initialMessages$: WS.get('initial messages'),

    newMessage$: WS.get('new message'),

    numUsers$: WS.get('channel numUsers updated'),

    wordScores$: Worker.get('word scores')::startsWith({}),

    changeMessageScore$: most.merge(
    DOM.select('span.message-flare').events('click').tap(ev => ev.preventDefault()).map(ev => ({messageId: parseInt(ev.currentTarget.parentNode.dataset.id), delta: 1})),
    DOM.select('span.message-good').events('click').tap(ev => ev.preventDefault()).map(ev => ({messageId: parseInt(ev.currentTarget.parentNode.dataset.id), delta: -1}))
  ),

  messageScore$: WS.get('update message score'),
}
}

function model(actions) {
const selectedMessages$ = actions.changeText$
    .merge(actions.postText$.constant(''))
    .map(text => {
      return new Set(getReplyTos(text))
    }).debounce(500)::startsWith(new Set())

  const currentInputtingScore$ = most.combineArray((text, wordScores) => {
      const words = segment(text)
      console.log(words)
      return Math.round(words.map(word => `*${word}` in wordScores ? wordScores[`*${word}`] : 0).reduce((a, c) => a + c, 0) / words.length)
    }, [actions.changeText$, actions.wordScores$]).debounce(500)::startsWith(0).map(n => Number.isNaN(n) ? 0 : n)


  const newMessageMod$ = actions.newMessage$.map(message => messages => [message, ...messages])
  const messageScoreMod$ = actions.messageScore$.map(({messageId, score}) => messages => {
    const msg = _.find(messages, m => m.messageId === messageId)
    if (msg) {
      msg.score = score
      return messages
    }
    return messages
  })
  const messages$ = most.mergeArray([actions.initialMessages$, newMessageMod$, messageScoreMod$]).scan((a, c) => {
    if (a === null) return c
    console.log(c)
    return _(c(a)).sortBy(message => -message.messageId).sortedUniqBy(message => -message.messageId).value()
  }, null).skip(1)

  const currentMessageFilter$ = actions.clickMessage$
    .map(messageId => messages => {
      const result = []
      const len = messages.length
      let i = 0
      const replyToIds = new Set()
      for (i = 0; i < len; ++i) {
        const message = messages[i]
        if (message.messageId === messageId) {
          getReplyTos(message.contents).forEach(id => {
            replyToIds.add(id)
          })
          result.push(message)
          break
        }
        if (getReplyTos(message.contents).indexOf(messageId) !== -1) {
          result.push(message)
        }
      }
      for (let j = i + 1; j < len; ++j) {
        const message = messages[j]
        if (replyToIds.has(message.messageId)) {
          result.push(message)
          getReplyTos(message.contents).forEach(id => {
            replyToIds.add(id)
          })
        }
      }
      return result
    }).merge(actions.changeText$.constant(m => m)).merge(actions.clickHeader$.constant(m => m))::startsWith(m => m)

  return most.combineArray((messages, selectedMessages, currentMessageFilter, numUsers, currentInputtingScore) => (
    {messages: currentMessageFilter(messages), selectedMessages, numUsers, currentInputtingScore}
  ), [messages$, selectedMessages$, currentMessageFilter$, actions.numUsers$::startsWith(null), currentInputtingScore$])
}

function view({messages, selectedMessages, numUsers, currentInputtingScore}, channelId) {
  function normalizeScore(score) {
    return score / 10
  }
  console.log(currentInputtingScore)
  const messageColorScale = chroma.scale(['rgba(255, 255, 255, 0.8)', 'rgba(255, 0, 10, 0.5)']).mode('lab')

  const selectedMessagesElm = messages.filter(m => selectedMessages.has(m.messageId))
    .map(createMessageElm)

  const messagesElm = messages.filter(m => !selectedMessages.has(m.messageId))
    .map(createMessageElm)

  function createMessageElm(message) {
    return h('li.message', {
      key: message.messageId,
      style: {
        backgroundColor: messageColorScale(normalizeScore(message.score)).css(),
        opacity: '0', transition: 'opacity 0.6s', delayed: {opacity: '1'},
      },
      attrs: {
        'data-id': message.messageId,
      },
    }
    , [
        h('span.message-id', `${message.messageId}`),
        h('span.message-flare', '🔥'),
        h('span.message-good', '😀'),
        h('span.message-contents', message.contents),
      ])
  }

  return h('div', [
           V.header(channelId, `${numUsers} people in this channel`),
           h('form#post', {props: {action: ''}}, [
             h('input#post-text', {
               props: {type: 'text', placeholder: 'type here', autocomplete: 'off'},
               style: {backgroundColor: messageColorScale(normalizeScore(currentInputtingScore))},

             }),
           ]),
           h('div.main', [
             h('div.messages', (selectedMessagesElm.length === 0 ? [
               h('ul', messagesElm),
             ] : [h('ul.selected-messages', selectedMessagesElm), h('ul', messagesElm)])),
           ]),
         ])
}

function webSocket(actions, state$, channelId) {
  const postMessage$ = most.combineArray((contents, currentScore) => ({
    type: 'send',
    value: {
      eventName: 'post message',
      value: {
        contents,
        score: currentScore,
        replyTo: [],
      }
    }
  }), [actions.postText$, state$.map(({currentInputtingScore}) => currentInputtingScore)]).sampleWith(actions.postText$)

  const updateScore$ = actions.changeMessageScore$.map(({delta, messageId}) => ({
    type: 'send',
    value: {
      eventName: 'update message score',
      value: {
        messageId,
        delta,
      }
    }
  }))
  return most.merge(postMessage$, updateScore$)
    ::startsWith({type: 'connect', value: `ws://<[<[*WS_HOST*]>]>/api/channel/${channelId}`})
}

function Chat(sources, channelId) {

  const actions = intent(sources)
  const state$ = model(actions)::pm.hold()
  const VTree$ = state$.map(state => view(state, channelId))


  const worker$ = state$.sampleWith(most.periodic(10000).delay(2000))
    .map(({messages}) => messages.map(m => [m.contents, m.score]))
    .map(value => ({eventName: 'segment', value})).tap(o => console.log(o))


  return {
    DOM: VTree$,
    ROUTER: utils.makeCurrentLocation$(sources.DOM),
    WS: webSocket(actions, state$, channelId),
    Worker: worker$,
  }
}

export default Chat

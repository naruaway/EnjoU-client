import {segment} from './lib/tiny-segmenter'

self.onmessage =  (ev) => {
  const {eventName, value} = JSON.parse(ev.data)
  if (eventName === 'segment') {
    const messages = value
    const wordScores = {}
    messages.forEach(message => {
      const words = segment(message[0])
      const score = message[1]
      words.forEach(word => {
        wordScores[`*${word}`] = (`*${word}` in wordScores ? wordScores[`*${word}`] : 0) + score
      })
    })
    self.postMessage(JSON.stringify({
      eventName: 'word scores',
      value: wordScores,
    }))
  }
}

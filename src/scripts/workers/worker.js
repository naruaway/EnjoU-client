import {segment} from '../lib/tiny-segmenter'
import _ from 'lodash'

self.onmessage =  (ev) => {
  const {eventName, value} = JSON.parse(ev.data)
  if (eventName === 'segment') {
    const messages = value
    const wordScores = {}
    const wordCounts = {}
    messages.forEach(message => {
      const words = segment(message[0].replace(/@([1-9][0-9]+|[1-9])/g, ' ')).map(w => w.trim()).filter(w => w)
      const score = message[1]
      words.forEach(word => {
        wordScores[`*${word}`] = (`*${word}` in wordScores ? wordScores[`*${word}`] : 0) + score
        wordCounts[`*${word}`] = (`*${word}` in wordCounts ? wordCounts[`*${word}`] : 0) + 1
      })
    })

    _.forEach(wordScores, (score, word) => {
      wordScores[word] /= wordCounts[word]
    })

    self.postMessage(JSON.stringify({
      eventName: 'word scores',
      value: wordScores,
    }))
  }
}

import {segment} from './lib/tiny-segmenter'

self.addEventListener('message', function(e) {
  const {eventName, value} = JSON.parse(e.data)
  if (eventName === 'segment') {
    self.postMessage({
      eventName: 'tako',
      value: value.map(segment),
    })
  }
}, false)

import most from 'most'

import io from 'socket.io-client'

function makeSocketDriver(url) {
  const socket = io(url)

  function get(eventName) {
    return most.create((add, end, error) => {
      const sub = socket.on(eventName, (message) => {
        add(message)
      })
      return () => { sub.dispose() }
    })
  }

  function publish(messageType, message) {
    socket.emit(messageType, message)
  }

  return event$ => {
    event$.observe(event => publish(event.messageType, event.message));
    return {
      get,
      dispose: socket.destroy.bind(socket)
    }
  }
}

export default {makeSocketDriver}


function isolateSource(incoming$, scope) {
  console.log('isolateSource')
  return incoming$
}
function isolateSink(outgoing$, scope) {
  console.log('isolateSink')
  return outgoing$
}

export {makeSocketDriver}

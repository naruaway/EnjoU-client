import most from 'most'

function makeSocketDriver() {
  let currentSocket = null

  const callbacks = new Map()

  function onmessage(event) {
    const message = JSON.parse(event.data)
    callbacks.forEach((eventName, fn) => {
      if (message.eventName !== eventName) return
      fn(message.value)
    })
  }

  function get(eventName) {
    return most.create((add, end, error) => {
      callbacks.set(add, eventName)
      return () => {
        callbacks.delete(add)
      }
    }).multicast()
  }

  return event$ => {
    event$.observe(event => {
      if (event.type === 'connect') {
        const endpoint = event.value
        if (currentSocket !== null) {
          currentSocket.close()
          currentSocket = null
        }
        currentSocket = new WebSocket(endpoint)
        currentSocket.onmessage = onmessage
      } else if (event.type === 'send') {
        if (currentSocket === null) {
          throw new Error('currentSocket must not be null while sending a value')
        }
        const value = event.value
        currentSocket.send(JSON.stringify(value))
      }
    })

    return {get}
  }
}


export {makeSocketDriver}

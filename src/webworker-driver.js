import most from 'most'

function makeWorkerDriver(workerFilename) {
  const worker = new Worker(workerFilename)
  worker.onmessage = onmessage

  const callbacks = new Map()

  function onmessage(event) {
    const message = event.data
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

  return value$ => {
    value$.observe(value => {
      worker.postMessage(JSON.stringify(value))
    })

    return {get}
  }
}


export {makeWorkerDriver}

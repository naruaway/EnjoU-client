import most from 'most'
/*
function makeWebSocketDriver(peerId) {
  const sock = new WebSocket(peerId);
  return function sockDriver(outgoing$) {
    outgoing$.observe(outgoing => sock.send(outgoing));
    const incoming$ = most.create((add, end, error) => {
      sock.onmessage = message => add(message)
      sock.onerror = error
      return () => console.log('disposing websocket')
    })
    return incoming$
  }
}
*/

function makeWebSocketMockDriver() {
  return (source$) => {
    source$.observe(o => console.log(`[webSocketMockDriver] ${o}`))
    const sink$ = most.periodic(1000).constant({text: 'Hello!'})
    sink$.isolateSink = isolateSink
    sink$.isolateSource = isolateSource
    return sink$
  }
}

function isolateSource(incoming$, scope) {
  console.log('isolateSource')
  return incoming$
}
function isolateSink(outgoing$, scope) {
  console.log('isolateSink')
  return outgoing$
}

export {makeWebSocketMockDriver}

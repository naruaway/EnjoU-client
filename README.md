# EnjoU client
## how to build
`WS_HOST` env var is web socket endpoint (e.g. localhost:8080)
```bash
npm install
npm install -g gulp
gulp build
```

## how to deploy
- `WS_HOST=<WEBSOCKET_SERVER_HOST> gulp build`
- `cd deploy`
- `ansible-playbook -i hosts deploy.yml`

## how to launch mock server
`gulp`

## WebSocket interface
* end point: /api/channel/:channelId

## events example
### client to server
```
{ eventName: 'post message',
  value: {
    contents: 'hello this is contents',
    score: 21,
    replyTo: [],
  }
}
```

### server to client

```
{ eventName: 'initial messages',
  value: {
    contents,
    score: 0,
    replyTo: [],
  }
}

{ eventName: 'initial messages',
  value: Array<Message>
}

{ eventName: 'new message',
  value: Message
}

{ eventName: 'channel numUsers updated',
  value: 32
}
```

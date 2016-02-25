import {h} from '@motorcycle/dom'

function header(id, text='') {
  return h('header',
    id
      ? [h('img', {props: {src: '/images/enjou.png', height: 50}}), h('div', `(id: ${id}) ${text}`)]
      : [h('img', {props: {src: '/images/enjou.png', height: 50}})])
}

export default {header}

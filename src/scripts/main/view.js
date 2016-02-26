import {h} from '@motorcycle/dom'

function header(text='') {
  return h('header.header',
    text
      ? [h('img', {props: {src: '/images/enjou.png', height: 50}}), h('div', `${text}`)]
      : [h('img', {props: {src: '/images/enjou.png', height: 50}})])
}

export default {header}

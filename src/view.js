import {h} from '@motorcycle/dom'

function header(id) {
  return h('header', id ? [h('img', {props: {src: '/images/enjou.png', height: 50}}), `(id: ${id})`] : [h('img', {props: {src: '/images/enjou.png', height: 50}})])
}

export default {header}

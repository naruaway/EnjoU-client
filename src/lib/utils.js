function makeCurrentLocation$(DOM) {
  return DOM.select('a.link').events('click').filter(ev => {
    if (ev.currentTarget.tagName !== 'A') return false
    const href = ev.currentTarget.getAttribute('href')
    if (!href.startsWith('/')) return false
    if (href.startsWith('//')) return false
    return true
  }).tap(ev => ev.preventDefault())
  .map(ev => ev.currentTarget.getAttribute('href'))
}

export default { makeCurrentLocation$ }

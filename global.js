const GL = {
  D_UP: 'd-up',
  D_DN: 'd-down',
  D_LT: 'd-left',
  D_RT: 'd-right',

  TYPE_LINK: 'link',
  TYPE_TEXT: 'text',
  TYPE_IMG: 'img',

  SAMEPAGE: 'Same page',
  FOREGROUND: 'Foreground',
  BACKGROUND: 'Background',

  containerNames: [
    'text-container',
    'link-container',
    'img-container'
  ],

  directionOptionsNames: [
    'd-up-options',
    'd-down-options',
    'd-left-options',
    'd-right-options'
  ],

  optionListNames: [
    'engine-list',
    'fore-back-list',
  ],

  DEFAULT_ENGINE: 'Default search engine',

  getKeyName(cProduct) {
    return cProduct.join('>')
  },

  getProperties(keyName) {
    // keyName example: 
    // link-container>d-down-options>fore-back-list
    const [containerName, directionOptionsName, optionListName] = keyName.split('>')
    const type = containerName.substring(0, containerName.lastIndexOf('-'))
    const direction = directionOptionsName.substring(0, directionOptionsName.lastIndexOf('-'))
    const option = optionListName.substring(0, optionListName.lastIndexOf('-'))

    return { type, direction, option };
  },

  cartesian: function* carte(head, ...tail) {
    let remainder = tail.length ? carte(...tail) : [[]];
    for (let r of remainder)
      for (let h of head) yield [h, ...r];
  },

  isURL(str) {
    // Modified from https://stackonDragOverlow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
    const regex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/i;
    // console.log(regex.test(str))
    return regex.test(str)
  },

}

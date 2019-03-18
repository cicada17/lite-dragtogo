const actions = (function() {
  const getCurrentTab = async function() {
    const queryTabs = await browser.tabs.query({
      currentWindow: true,
      active: true
    })
    return queryTabs[0];
  }

  const openURL = async function(targetUrl, openStylePref) {
    // return tab object of updated tab
    switch (openStylePref) {
      case GL.SAMEPAGE:
        return browser.tabs.update({ url: targetUrl })
      case GL.FOREGROUND:
      case GL.BACKGROUND:
        {
          const toBeForeground = (openStylePref === GL.FOREGROUND)
          const currentTab = await getCurrentTab()
          return browser.tabs.create({
            url: targetUrl,
            active: toBeForeground,
            openerTabId: currentTab.id,
          })
        }
      default:
        throw 'Error: cannot understand openStylePref.'
    }
  }

  const search = async function(searchQuery, openStylePref, engineName) {
    if (engineName === GL.DEFAULT_ENGINE) {
      engineName = ''
    }
    console.log(openStylePref)
    const currentTab = await getCurrentTab()
    switch (openStylePref) {
      case GL.SAMEPAGE:
        browser.search.search({
          query: searchQuery,
          engine: engineName,
          tabId: currentTab.id,
        })
        return currentTab
      case GL.FOREGROUND:
      case GL.BACKGROUND:
        {
          const toBeForeground = (openStylePref === GL.FOREGROUND)
          const newTab = await browser.tabs.create({
            url: 'about:blank',
            active: toBeForeground,
            openerTabId: currentTab.id,
          })
          browser.search.search({
            query: searchQuery,
            engine: engineName,
            tabId: newTab.id
          })
          return newTab
        }
      default:
        throw 'Error: cannot understand openStylePref.'
    }
  }

  return {
    openURL,
    search,
  }
})()


const handlers = (function() {
  const actionPref = {
    [GL.TYPE_TEXT]: {
      [GL.D_UP]: {},
      [GL.D_DN]: {},
      [GL.D_LT]: {},
      [GL.D_RT]: {},
    },
    [GL.TYPE_LINK]: {
      [GL.D_UP]: {},
      [GL.D_DN]: {},
      [GL.D_LT]: {},
      [GL.D_RT]: {},
    },
    [GL.TYPE_IMG]: {
      [GL.D_UP]: {},
      [GL.D_DN]: {},
      [GL.D_LT]: {},
      [GL.D_RT]: {},
    },
  }

  const loadActionPref = async function() {

    const getAndUpdateHelper = async (keyName) => {
      const response = await browser.storage.local.get(keyName)
      if (response[keyName]) {
        const { type, direction, option } = GL.getProperties(keyName)
        actionPref[type][direction][option] = response[keyName]
      }
    }

    const promises = []
    for (let cProduct of GL.cartesian(GL.containerNames, GL.directionOptionsNames, GL.optionListNames)) {
      const [containerName, directionOptionsName, optionListName] = cProduct
      const keyName = GL.getKeyName(cProduct)
      promises.push(getAndUpdateHelper(keyName))
    }
    await Promise.all(promises)
    console.log('Options updated in background.js')
    console.log(actionPref)
  }

  const handleDragContent = function(message) {
    if (!message.dragContent) return;
    const content = message.dragContent
    let type = GL.isURL(content) ? GL.TYPE_LINK : GL.TYPE_TEXT
    switch (type) {
      case GL.TYPE_LINK:
        {
          console.log('link')
          const direction = getDirection(message.dx, message.dy, 2)
          linkHandler(content, direction)
          break;
        }
      case GL.TYPE_TEXT:
        {
          if (message.isATag) {
            console.log('No content. Is A Tag.')
            break
          }
          console.log('text')
          const direction = getDirection(message.dx, message.dy, 4)
          textHandler(content, direction)
          break;
        }
      default:
        throw 'Error: Could not understand message.contentType.'
    }
  }

  const getDirection = function(dx, dy, numDirections) {
    // In browsers, positive dy means downward movement.
    // Revert dy according to math convention.
    dy = -dy
    switch (numDirections) {
      case 2:
        return (dy > 0) ? GL.D_UP : GL.D_DN
      case 4:
        if (Math.abs(dx) > Math.abs(dy))
          return (dx > 0) ? GL.D_RT : GL.D_LT
        else
          return (dy > 0) ? GL.D_UP : GL.D_DN
      default:
        throw 'Error: unexpected numDirections.'
    }
  }

  const linkHandler = function(url, direction) {
    if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) {
      url = 'http://' + url
    }
    const openStylePref = actionPref[GL.TYPE_LINK][direction]['fore-back']
    console.log(direction, openStylePref, url)
    actions.openURL(url, openStylePref)
  }

  const textHandler = function(text, direction) {
    const engine = actionPref[GL.TYPE_TEXT][direction]['engine']
    const openStylePref = actionPref[GL.TYPE_TEXT][direction]['fore-back']
    // console.log(actionPref)
    console.log(direction, openStylePref, engine, text)
    actions.search(text, openStylePref, engine)
  }

  const handleMessage = function(message) {
    switch (message.action) {
      case 'update':
        loadActionPref();
        break;
      case 'handle':
        handleDragContent(message);
        break;
      default:
        throw 'Error: Could not understand message.action.'
    }
  }

  const onStorageChanged = function(changes) {
    const keyNames = Object.keys(changes)
    for (let keyName of keyNames) {
      const { type, direction, option } = GL.getProperties(keyName)
      actionPref[type][direction][option] = changes[keyName].newValue
      console.log(keyName, changes[keyName].newValue)
      console.log(actionPref)
    }
    console.log('Options updated in background.js')
  }

  const attachEvents = function() {
    browser.storage.onChanged.addListener(onStorageChanged);
    browser.runtime.onMessage.addListener(handleMessage);
  }

  return {
    attachEvents,
    loadActionPref,
  }
})()


const main = (function() {
  handlers.attachEvents()
  handlers.loadActionPref()

  browser.browserAction.onClicked.addListener(async () => {
    await browser.runtime.openOptionsPage();
    console.log('Opened option page.')
  })

})()

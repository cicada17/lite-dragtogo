engineNames = []
const CACHE = {}

function loadEngines(engines) {
  console.log(`There were: ${engines.length} search engines retrieved.`);
  engineNames = engines.map(engine => engine.name)
  engineNames.unshift(GL.DEFAULT_ENGINE)
  console.log(engineNames)
}

function addOptions() {
  const addOptionsByClassHelper = (optionNames, className) => {
    const nodes = document.getElementsByClassName(className)
    for (let node of nodes) {
      const fragment = document.createDocumentFragment()
      let option;
      for (let optionName of optionNames) {
        option = document.createElement('option')
        option.value = option.text = optionName
        fragment.appendChild(option)
      }
      node.appendChild(fragment)
    }
  }

  addOptionsByClassHelper(engineNames, 'engine-list')
  addOptionsByClassHelper(
    [GL.FOREGROUND, GL.BACKGROUND, GL.SAMEPAGE], 'fore-back-list'
  )

  restoreOptions()
}

async function saveOptions(e) {
  e.preventDefault();

  const promises = []
  for (let cProduct of GL.cartesian(GL.containerNames, GL.directionOptionsNames, GL.optionListNames)) {
    const [containerName, directionOptionsName, optionListName] = cProduct
    const cssQuery = '#' + containerName
      + '> .' + directionOptionsName
      + '> .' + optionListName;
    const selectDOM = document.querySelector(cssQuery)
    if (selectDOM) {
      const keyName = GL.getKeyName(cProduct)
      const val = getSelectedOptionValue(selectDOM)
      if (!(keyName in CACHE) || val !== CACHE[keyName]) {
        promises.push(browser.storage.local.set({
          [keyName]: val
        }))
        CACHE[keyName] = val
      }
    }
  }

  await Promise.all(promises)
  console.log('Options updated in browser.storage')
  document.getElementById('saved-text').style.display = 'none';
  setTimeout(() => {
    document.getElementById('saved-text').style.display = 'block';
  }, 100)
}

async function restoreOptions() {

  const getPromises = []
  const getAndSelectHelper = async (keyName, selectDOM) => {
    const response = await browser.storage.local.get(keyName)
    if (keyName in response) {
      selectDOM.value = response[keyName]
      CACHE[keyName] = response[keyName]
      // console.log('Got'+response[keyName])
      // console.log(CACHE)
    }
  }

  for (let cProduct of GL.cartesian(GL.containerNames, GL.directionOptionsNames, GL.optionListNames)) {
    const [containerName, directionOptionsName, optionListName] = cProduct
    const cssQuery = '#' + containerName
      + '> .' + directionOptionsName
      + '> .' + optionListName;
    const selectDOM = document.querySelector(cssQuery)
    if (selectDOM) {
      const keyName = GL.getKeyName(cProduct)
      getPromises.push(getAndSelectHelper(keyName, selectDOM))
    }
  }

  const result = await Promise.all(getPromises)
  console.log('Restored options')
  return result
}

function getSelectedOptionValue(selectDOM) {
  return selectDOM.options[selectDOM.selectedIndex].value
}

const main = (function() {
  const init = async function() {
    const engines = await browser.search.get()
    loadEngines(engines)
    addOptions()
    document.getElementById('saved-text').style.display = 'none';
  }
  document.addEventListener('DOMContentLoaded', init);
  document.querySelector('form').addEventListener('submit', saveOptions);
})()

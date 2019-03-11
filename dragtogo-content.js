const listeners = (function() {

  let eventsAttached = false
  const dragInfo = {
    startx: 0,
    starty: 0,
    content: null,
    isATag: false,

    reset() {
      this.startx = this.starty = 0
      this.content = null
      this.isATag = false
    },
  }


  const onDragStart = function(event) {
    console.log('DragtoGo: start')
    dragInfo.reset()
    // the node currently being dragged
    const node = event.target
    if (node.nodeName === 'A') {
      dragInfo.isATag = true
      dragInfo.content = node.href
    } else {
      dragInfo.content = window.getSelection().toString()
    }
    [dragInfo.startx, dragInfo.starty] = [event.clientX, event.clientY]
    console.log(node)
    console.log(`DragtoGo: startx: ${dragInfo.startx}, starty: ${dragInfo.starty}, nodeName: ${node.nodeName}, content: ${dragInfo.content}, isATag: ${dragInfo.isATag}`);
  }

  const onDragOver = function(event) {
    console.log('DragtoGo: over');
    event.preventDefault();
  }

  const onDrop = async function(event) {
    console.log('DragtoGo: drop');
    if (!dragInfo.content || util.nodeAcceptsDrops(event.target)) return;
    event.preventDefault();
    const message = {
      action: 'handle',
      dragContent: dragInfo.content,
      dx: (event.clientX - dragInfo.startx),
      dy: (event.clientY - dragInfo.starty),
      isATag: dragInfo.isATag,
    }
    browser.runtime.sendMessage(message);
    console.log('DragtoGo: Sending message: ', message)
  }

  const attachEvents = function() {
    if (eventsAttached) return;
    document.addEventListener('dragstart', onDragStart)
    document.addEventListener('dragover', onDragOver)
    document.addEventListener('drop', onDrop)
    eventsAttached = true
    console.log('Content script injected.')
  }

  return {
    attachEvents,
  }
})()

const util = {
  nodeAcceptsDrops(node) {
    // From Quickdrop
    if (!node) return false;
    else return (
      (node.nodeName === 'TEXTAREA')
      || ('mozIsTextField' in node && node.mozIsTextField(false))
      || ('isContentEditable' in node && node.isContentEditable)
      || ('ownerDocument' in node
        && 'designMode' in node.ownerDocument
        && node.ownerDocument.designMode.toLowerCase() === 'on')
      || (node.hasAttribute('dropzone')
        && node.getAttribute('dropzone').replace(/^\s+|\s+$/g, '').length)
    )
  },
}

const main = (function() {
  window.addEventListener('DOMContentLoaded', listeners.attachEvents);
  window.addEventListener('load', listeners.attachEvents)
})()

/* eslint-env browser */
/* global goog */
// <!-- start production -->
goog.require('goog.dom')
goog.require('goog.dom.TagName')
goog.require('goog.net.XhrIo')
goog.require('goog.format.JsonPrettyPrinter')
goog.require('goog.html.SafeHtml')
goog.require('goog.events.FileDropHandler')
goog.require('goog.ui.AnimatedZippy')
// <!-- end production -->

import upload from './upload.js'

function sayHi(data) {
  const div = goog.dom.createDom(goog.dom.TagName.DIV, {
    style: 'background-color:#EEE',
  }, data)
  goog.dom.appendChild(document.body, div)
}

const fileInput = document.getElementById('file')
const btn = document.querySelector('#btn')

const dropZone = goog.dom.getElement('drop-zone')
new goog.events.FileDropHandler(dropZone, true)
goog.events.listen(dropZone, 'drop', (e) => {
  const { files } = e.getBrowserEvent().dataTransfer
  fileInput.files = files
})
const dragEnter = (e) => {
  addClass(e.target, 'DragActive')
}
const dragLeave = (e) => {
  removeClass(e.target, 'DragActive')
}
const drop = (e) => {
  removeClass(e.target, 'DragActive')
}
const removeClass = (el, className) => {
  const current = el.className.split(' ').map(a => a.trim())
  const newClasses = current.filter(a => a != className)
  el.className = newClasses.join(' ')
}
const addClass = (el, className) => {
  const current = el.className.split(' ').map(a => a.trim())
  el.className = [...current, className].join(' ')
}
goog.events.listen(dropZone, 'dragenter', dragEnter)
goog.events.listen(dropZone, 'dragleave', dragLeave)
goog.events.listen(dropZone, 'drop', drop)

btn.onclick = async () => {
  const [file] = fileInput.files
  if (!file) return
  upload(file)
}
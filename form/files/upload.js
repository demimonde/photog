/* eslint-env browser */
/* global exif2css */
/* global goog */

const IGNORE = ['SourceFile', 'Directory', 'FileName', 'FileModifyDate', 'FileAccessDate', 'FileInodeChangeDate', 'FilePermissions']

const encode = async (file) => {
  return await new Promise((r) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      const base64encoded = reader.result
      r(base64encoded)
    })
    reader.readAsDataURL(file)
  })
}


export default
async function upload(file) {
  const el = goog.dom.getElement('d')
  el.style.visibility = ''
  const pb = new goog.ui.ProgressBar
  pb.render(el)
  const res = await upload2(file, (percent) => {
    pb.setValue(percent)
  })
  el.style.visibility = 'hidden'
  const dem = new goog.format.JsonPrettyPrinter.SafeHtmlDelimiters()
  dem.lineBreak = goog.html.SafeHtml.BR
  dem.space = '&nbsp;'
  const f = new goog.format.JsonPrettyPrinter(dem)
  IGNORE.forEach(p => {
    delete res[p]
  })
  const mapHolder = goog.dom.createDom(goog.dom.TagName.DIV, {
    style: 'position: relative; display: inline-block; width: 250px; height: 250px;',
  })
  let add
  const { 'GPSLatitude': lat, 'GPSLongitude': long } = res
  if (lat && long) {
    const Lat = parseFloat(lat)
    const Long = parseFloat(long)
    const la = Lat.toFixed(3)
    const lo = Long.toFixed(3)
    const map = goog.dom.createDom(goog.dom.TagName.IMG, {
      src: `/map?center=${lo},${la}`,
    })
    mapHolder.appendChild(map)
    mapHolder.appendChild(goog.dom.createDom(goog.dom.TagName.DIV, {
      style: 'position: absolute; top: 123px; left: 123px; background:red; border-radius: 3px; width: 6px; height: 6px;',
    }))
  }
  if (res['Location'] && res['Location']['addresses'].length) {
    const address = res['Location']['addresses'][0]['address']
    // const { streetName, municipalitySubdivision, municipality } = address
    add = goog.dom.createDom(goog.dom.TagName.EM, {
      style: 'display: block',
    }, [address['streetName'], address['municipalitySubdivision'] || address['municipality']].filter(a => a).join(', '))
  }
  const re = exif2css(res['Orientation'])
  const { 'transform-origin': transformOrigin,
    'transform': transform  } = re
  const html = f.format(res)
  const style = [
    'vertical-align: top',
    'max-height: 250px',
    ...(res['Orientation'] > 4 ? ['max-width: 250px'] : []),
    ...(transform ? [`transform: ${transform}`] : []),
    ...(transformOrigin ? [`transform-origin: ${transformOrigin}`] : []),
  ].join(';')
  const src = await encode(file)
  const img = goog.dom.createDom(goog.dom.TagName.IMG, {
    src,
    style,
  })
  const result = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': 'Result',
    style: 'display: inline-block;font-family:monospace;',
  })
  result.innerHTML = html
  const header = goog.dom.createDom(goog.dom.TagName.H2)
  header.innerHTML = '<img src="images/blank.gif"> Metadata'
  const metadata = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': 'Metadata',
  })
  metadata.appendChild(header)
  metadata.appendChild(result)
  const id = document.getElementById('info')
  id.innerHTML = ''
  id.appendChild(img)
  if (mapHolder) id.appendChild(mapHolder)
  if (add) id.appendChild(add)
  id.appendChild(metadata)
  new goog.ui.AnimatedZippy(header, result, true)
}

async function executeUpload(base64encoded) {
  const res = await new Promise((r) => {
    const xhr = goog.net.XhrIo.send('/api/mnp', () => {
      var obj = xhr.getResponseJson()
      r(obj)
    }, 'POST', base64encoded)
    goog.events.listen(xhr.xhr_.upload, 'progress', ({ event_ }) => {
      console.log('Uploaded ' + event_.loaded + '/' + event_.total)
    })
  })
  return res
}

// export default
async function upload2(file, progressCallback) {
  return await new Promise((r, j) => {
    const xhr = new XMLHttpRequest()
    const fd = new FormData()
    fd.append('file', file)
    xhr.open('POST', '/api/mnp', true)
    if (progressCallback) {
      xhr.upload.onprogress = function(e){
        const percentComplete = Math.ceil((e.loaded / e.total) * 100)
        progressCallback(percentComplete)
      }
    }
    xhr.onload = function () {
      if (this.status == 200) {
        try {
          const js = JSON.parse(this.response)
          r(js)
        } catch (err) {
          j('Could not parse JSON:' + err.message)
        }
      } else {
        j('status code was not 200')
      }
    }
    xhr.send(fd)
  })
}
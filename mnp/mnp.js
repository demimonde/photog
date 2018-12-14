import { ExiftoolProcess } from 'node-exiftool'
import exiftool from 'dist-exiftool'
import { Parse, getBoundary } from 'parse-multipart'
import { Readable } from 'stream'
import { stringify } from 'querystring'
import { jqt } from 'rqt'

export default async function (context, req) {
  if (req.method == 'GET') {
    if (req.body) req.body = req.body.slice(0, 100)
    if (req.rawBody) req.rawBody = req.rawBody.slice(0, 100)
    const body = JSON.stringify(req, null, 2)
    return body
  } else if (req.method == 'POST') {
    const { 'content-type': contentType } = context.req.headers
    if (!contentType.startsWith('multipart/form-data')) {
      return { status: 401, body: 'not multipart' }
    }
    const boundary = getBoundary(contentType)
    if (!boundary) {
      return { status: 401, body: 'no boundary' }
    }
    const parts = Parse(req.body, boundary)
    //  { body: JSON.stringify({
    //   parts,
    //   boundary,
    //   data: req.rawBody.slice(0, 100),
    // }, null, 2), type: 'application/json' }
    const [part] = parts
    if (!part) throw new Error('File not found')
    const ep = new ExiftoolProcess(exiftool)
    await ep.open()
    const rs = new Readable({
      read() {
        this.push(part.data)
        this.push(null)
      },
    })
    const { data, error } = await ep.readMetadata(rs, ['n'])
    if (error) {
      throw error
    }
    await ep.close()
    const [body] = data
    if (body.GPSLatitude && body.GPSLongitude) {
      const loc = await getLocation(body.GPSLatitude, body.GPSLongitude)
      context.log(loc)
      body.Location = loc
    }

    return {
      body,
      headers: {
        'content-type': 'application/json',
      },
    }
    // if (req.body) req.body = `${req.body.slice(0, 30)}...`
    // if (req.rawBody) req.rawBody = req.rawBody.slice(0, 200)
    // const body = JSON.stringify(req, null, 2)
    // return { body, 'content-type': 'application/json' }
  }
}


const getLocation = async (lat, long) => {
  const s = stringify({
    'subscription-key': process.env.AZURE_MAPS_KEY,
    'api-version': '1.0',
    query: `${lat},${long}`,
  })
  const res = await jqt('https://atlas.microsoft.com/search/address/reverse/json?'
    + s)
  return res
}
export default async function (context, req) {
  if (req.method == 'GET') {
    if (req.body) req.body = req.body.slice(0, 100)
    if (req.rawBody) req.rawBody = req.rawBody.slice(0, 100)
    const body = JSON.stringify(req, null, 2)
    return body
  } else if (req.method == 'POST') {
    if (req.body) req.body = `${req.body.slice(0, 30)}...`
    if (req.rawBody) req.rawBody = req.rawBody.slice(0, 200)
    const body = JSON.stringify(req, null, 2)
    return { body, 'content-type': 'application/json' }
  }
}
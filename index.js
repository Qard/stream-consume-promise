const Channel = require('channel-surfer')

module.exports = consume

function consume(stream) {
  const requests = new Channel()
  const responses = new Channel()

  stream.on('readable', async () => {
    while (true) {
      const request = await requests.take()
      const size = request.value
      const chunk = stream.read(size)
      if (chunk === null) {
        requests.giveBack(size)
        break
      }

      responses.give(chunk)
    }
  })

  stream.on('error', (err) => {
    responses.error(err)
    requests.close()
  })

  stream.on('end', () => {
    responses.close()
    requests.close()
  })

  return (size) => {
    requests.give(size)
    return responses.take()
  }
}

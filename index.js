const Channel = require('channel-surfer')

module.exports = consume

function consume (stream) {
  const requests = new Channel()
  const responses = new Channel()

  function onError (error) {
    responses.error(error)
    requests.close()
  }

  stream.on('error', onError)
  stream.on('readable', async () => {
    try {
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
    } catch (error) {
      onError(error)
    }
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

const Channel = require('channel-surfer')

module.exports = consume

function consume (stream) {
  const requests = new Channel()
  const responses = new Channel()

  function onError (error) {
    responses.error(error)
    requests.close()
  }

  function onReadable () {
    requests.take()
      .then(request => {
        const size = request.value
        const chunk = stream.read(size)
        if (chunk === null) {
          requests.giveBack(size)
          return
        }

        responses.give(chunk)
        onReadable()
      })
      .catch(onError)
  }

  stream.on('readable', onReadable)
  stream.on('error', onError)
  stream.on('end', () => {
    responses.close()
    requests.close()
  })

  return (size) => {
    requests.give(size)
    return responses.take()
  }
}

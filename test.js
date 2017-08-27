const tap = require('tap')
const { PassThrough } = require('stream')
const consume = require('./')

function uid() {
  return new Buffer(Math.random().toString(35).substr(2, 16))
}

tap.test('basics', async (t) => {
  const stream = new PassThrough()
  stream.write('abc')
  stream.write('123567')
  stream.end()

  const read = consume(stream)

  // First 3 bytes
  {
    const chunk = await read(3)
    t.match(chunk, {
      value: new Buffer('abc'),
      done: false
    }, 'received first three bytes')
  }

  // Second 3 bytes
  {
    const chunk = await read(3)
    t.match(chunk, {
      value: new Buffer('123'),
      done: false
    }, 'received second three bytes')
  }

  // Third 3 bytes
  {
    const chunk = await read(3)
    t.match(chunk, {
      value: new Buffer('567'),
      done: false
    }, 'received third three bytes')
  }

  // End
  {
    const chunk = await read()
    t.match(chunk, {
      value: null,
      done: true
    }, 'received done flag')
  }

  t.end()
})

tap.test('parallel', async (t) => {
  const n = 100
  const sent = []
  const stream = new PassThrough()
  for (let i = 0; i < n; i++) {
    const value = uid()
    stream.write(value)
    sent.push(value)
  }
  stream.end()

  const read = consume(stream)
  const tasks = []
  for (let i = 0; i < n; i++) {
    tasks.push(read())
  }

  const chunks = await Promise.all(tasks)
  const values = chunks
    .filter(chunk => !chunk.done)
    .map(chunk => chunk.value)

  t.equal(
    Buffer.concat(values).toString(),
    Buffer.concat(sent).toString(),
    'received value'
  )

  // End
  {
    const chunk = await read()
    t.match(chunk, {
      value: null,
      done: true
    }, 'received done flag')
  }

  t.end()
})

tap.test('finalization', async (t) => {
  const stream = new PassThrough()
  stream.end()

  const read = consume(stream)

  // End
  {
    const chunk = await read()
    t.match(chunk, {
      value: null,
      done: true
    }, 'received done flag')
  }

  // End repeats due to finalization
  {
    const chunk = await read()
    t.match(chunk, {
      value: null,
      done: true
    }, 'received done flag again')
  }

  t.end()
})

tap.test('error finalization', async (t) => {
  const error = new Error('test')
  const stream = new PassThrough()
  const read = consume(stream)
  stream.emit('error', error)

  // End
  {
    try {
      const chunk = await read()
      t.fail('should have failed')
    } catch (err) {
      t.match(err, error, 'received error')
    }
  }

  // End repeats due to finalization
  {
    try {
      const chunk = await read()
      t.fail('should have failed')
    } catch (err) {
      t.match(err, error, 'received error again')
    }
  }

  t.end()
})

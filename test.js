const tap = require('tap')
const { PassThrough } = require('stream')
const consume = require('./')

function uid () {
  return Buffer.from(Math.random().toString(35).substr(2, 16))
}

tap.test('basics', (t) => {
  const stream = new PassThrough()
  stream.write('abc')
  stream.write('123567')
  stream.end()

  const read = consume(stream)

  // First 3 bytes
  return read(3)
    .then(chunk => {
      t.match(chunk, {
        value: Buffer.from('abc'),
        done: false
      }, 'received first three bytes')
    })
    // Second 3 bytes
    .then(() => read(3))
    .then(chunk => {
      t.match(chunk, {
        value: Buffer.from('123'),
        done: false
      }, 'received second three bytes')
    })
    // Second 3 bytes
    .then(() => read(3))
    .then(chunk => {
      t.match(chunk, {
        value: Buffer.from('567'),
        done: false
      }, 'received third three bytes')
    })
    // End
    .then(() => read())
    .then(chunk => {
      t.match(chunk, {
        value: null,
        done: true
      }, 'received done flag')
    })
})

tap.test('parallel', (t) => {
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

  return Promise.all(tasks)
    .then(chunks => {
      const values = chunks
        .filter(chunk => !chunk.done)
        .map(chunk => chunk.value)

      t.equal(
        Buffer.concat(values).toString(),
        Buffer.concat(sent).toString(),
        'received value'
      )
    })
    // End
    .then(() => read())
    .then(chunk => {
      t.match(chunk, {
        value: null,
        done: true
      }, 'received done flag')
    })
})

tap.test('finalization', (t) => {
  const stream = new PassThrough()
  stream.end()

  const read = consume(stream)

  // End
  return read()
    .then(chunk => {
      t.match(chunk, {
        value: null,
        done: true
      }, 'received done flag')
    })
    // End repeats due to finalization
    .then(() => read())
    .then(chunk => {
      t.match(chunk, {
        value: null,
        done: true
      }, 'received done flag again')
    })
})

tap.test('error finalization', (t) => {
  const error = new Error('test')
  const stream = new PassThrough()
  const read = consume(stream)
  stream.emit('error', error)

  // End
  return read()
    .then(
      () => t.fail('should have failed'),
      (err) => t.match(err, error, 'received error')
    )
    // End repeats due to finalization
    .then(() => read())
    .then(
      () => t.fail('should have failed'),
      (err) => t.match(err, error, 'received error again')
    )
})

tap.test('object streams', (t) => {
  const stream = new PassThrough({ objectMode: true })
  stream.setDefaultEncoding('utf8')
  stream.write('abc')
  stream.write('123567')
  stream.end()

  const read = consume(stream)

  // First object
  return read()
    .then(chunk => {
      t.match(chunk, {
        value: 'abc',
        done: false
      }, 'received first object')
    })
    // Second object
    .then(() => read())
    .then(chunk => {
      t.match(chunk, {
        value: '123567',
        done: false
      }, 'received second object')
    })
    // End
    .then(() => read())
    .then(chunk => {
      t.match(chunk, {
        value: null,
        done: true
      }, 'received done flag')
    })
})

tap.test('empty objects', (t) => {
  const stream = new PassThrough({
    objectMode: true
  })

  // Some line reading packages return strings without line endings
  stream.write('line 1')
  stream.write('')
  stream.write('line 3')
  stream.end()

  const read = consume(stream)

  // First line
  return read()
    .then(chunk => {
      t.match(chunk, {
        value: 'line 1',
        done: false
      }, 'received line 1')
    })
    // Second line
    .then(() => read())
    .then(chunk => {
      t.match(chunk, {
        value: '',
        done: false
      }, 'received the empty second line')
    })
    // Third line
    .then(() => read())
    .then(chunk => {
      t.match(chunk, {
        value: 'line 3',
        done: false
      }, 'received line 3')
    })
    // End
    .then(() => read())
    .then(chunk => {
      t.match(chunk, {
        value: null,
        done: true
      }, 'received done flag')
    })
})

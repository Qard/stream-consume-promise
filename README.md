# stream-consume-promise

[![Greenkeeper badge](https://badges.greenkeeper.io/Qard/stream-consume-promise.svg)](https://greenkeeper.io/)

Consume streams with a promise-based read function.

## Install

```sh
npm install stream-consume-promise
```

## Usage

```js
const consume = require('stream-consume-promise')

async function main(stream) {
  const read = consume(stream)
  while (true) {
    // The `read(...)` function accepts an optional size.
    // Omitting will read to the end of the internal buffer.
    const { done, value } = await read(16)
    if (done) break

    console.log('received', value)
  }
}

main(stream)
```

---

### Copyright (c) 2019 Stephen Belanger

#### Licensed under MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

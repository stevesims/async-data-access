# async-data-access

> React component for asynchronously fetching data

[![Travis][build-badge]][build]
[![NPM][npm-badge]][npm]
[![Coveralls][coveralls-badge]][coveralls]
[![JavaScript Style Guide][standardjs-badge]][standardjs]

[build-badge]: https://img.shields.io/travis/stevesims/async-data-access/master.svg
[build]: https://travis-ci.org/stevesims/async-data-access

[npm-badge]: https://img.shields.io/npm/v/async-data-access.svg
[npm]: https://www.npmjs.com/package/async-data-access

[coveralls-badge]: https://coveralls.io/repos/github/stevesims/async-data-access/badge.svg?branch=master
[coveralls]: https://coveralls.io/github/stevesims/async-data-access?branch=master

[standardjs-badge]: https://img.shields.io/badge/code_style-standard-brightgreen.svg
[standardjs]: https://standardjs.com

## Install

```bash
npm install --save async-data-access
```

## Usage

This component will load data asynchronously using the provided `fetch` function, and pass through status values and payload via the render-props pattern to a provided child render method.  An optional `transform` function can be given to transform the fetched response into a different format.

AsyncDataAccess is agnostic about how data is fetched, with only the expectation that the fetching will be performed asynchronously.  This means that it can be written using a modern `async` function, or alternatively using a `Promise`. The fetch method can potentially make multiple API calls and gather their results together.

Props accepted by this component are:
```js
{
  // `fetch` is the method to fetch data
  fetch: PropTypes.func.isRequired,
  // `transform` method that can be used for transforms on fetched data,
  // the intention being that `fetch` can be simple and error handling done before transforming attempted
  transform: PropTypes.func,
  // `onError` handler that will be called if an error occurs
  onError: PropTypes.func,
}
```

Props passed through to render child, with their types are:
```js
{
  isFetching: PropTypes.bool,       // Flag to indicate fetch is in progress
  didInvalidate: PropTypes.bool,    // Flag that indicates current fetch invalidated payload
  lastFetchFailed: PropTypes.bool,  // Flag that indicates last fetch failed
  lastError: PropTypes.string,      // String representing last error message received
  payload: PropTypes.any,           // Payload from fetch, defaults to null
  reload: PropTypes.func            // Function to trigger a reload
}
```

### Example

```jsx
import React, { Component } from 'react'

import AsyncDataAccess from 'async-data-access'

class Example extends Component {
  fetcher = async () => {
    // fetch data asynchronously from a server
    return await fetch('http://example.com/movies.json')
  }

  transformer (response) {
    // transform response to a different format (if required)
    return response.movieList
  }

  render () {
    return (
      <AsyncDataAccess fetch={this.fetcher} transform={this.transformer}>
        {
          props => {
            const { isFetching, payload } = props;
            const movies = payload || [];

            return <>
              { isFetching && <h2>Loading data</h2> }
              {
                movies.map(
                  ({ title, description }) => <>
                    <h3>{title}</h3>
                    <div>{description}</div>
                  </>
                )
              }
            </>
          }
        }
      </AsyncDataAccess>
    )
  }
}
```

## License

MIT © [stevesims](https://github.com/stevesims)

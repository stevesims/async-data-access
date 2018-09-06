import React from 'react'
import PropTypes from 'prop-types'

export default class AsyncDataAccess extends React.Component {
  static propTypes = {
    children: PropTypes.func,
    // `fetch` is the method to fetch data
    fetch: PropTypes.func.isRequired,
    // `transform` method that can be used for transforms on fetched data,
    // the intention being that `fetch` can be simple and error handling done before transforming attempted
    transform: PropTypes.func,
    // `onError` handler that will be called if an error occurs
    onError: PropTypes.func
  }

  static defaultProps = {
    fetch: () => null
  }

  state = {
    isFetching: false,
    payload: null,
    didInvalidate: false,
    lastFetchFailed: false,
    lastError: null
  }

  componentDidMount() {
    this.doFetch()
  }

  componentDidUpdate(prevProps) {
    // Trigger reload if our fetch has changed
    // TODO if we're only changing `transform` then we could skip re-isFetching
    // assuming we saved our pre-transformed payload
    if ((this.props.fetch !== prevProps.fetch) || (this.props.transform !== prevProps.transform)) {
      this.doFetch()
    }
  }

  async doFetch() {
    let res
    let payload

    this.setState({ isFetching: true })

    // TODO if this has been called as a reload then we should set `didInvalidate` to be true
    // Needs some more thought as to exact conditions under which that should happen
    // possibly it should instead just be a flag?

    try {
      res = await this.props.fetch(this.props)
      if (res instanceof Error) {
        throw res
      }
      if (this.props.transform) {
        payload = this.props.transform(res)
      } else {
        payload = res
      }
    } catch (ex) {
      try {
        if (this.props.onError) {
          this.props.onError(ex)
        }
      } catch (e) {
        // do nothing
      }
      let message
      // TODO change this to a transformError call
      if (ex.response && ex.response.data && ex.response.data.length && ex.response.data[0].description) {
        message = ex.response.data[0].description
      } else {
        ({message} = ex)
      }

      this.setState({
        isFetching: false,
        didInvalidate: true,
        lastFetchFailed: true,
        lastError: message
      })

      return
    }

    this.setState({
      payload,
      isFetching: false,
      didInvalidate: false,
      lastFetchFailed: false
    })
  }

  render() {
    return this.props.children({ ...this.state, reload: () => this.doFetch() })
  }
}

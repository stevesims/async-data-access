import React from 'react'
import { shallow, mount } from 'enzyme'

import AsyncDataAccess from '.'

describe('AsyncDataAccess', () => {
  it('renders with no params', () => {
    const wrapper = shallow(<AsyncDataAccess>{() => 'hi'}</AsyncDataAccess>)

    expect(wrapper).toBeTruthy()
  })

  it('has isFetching true when a fetch method is supplied on initial render', () => {
    const fetch = () => 'hi'
    const render = () => 'hi'
    const spyRender = jest.fn(render)

    mount(<AsyncDataAccess
      fetch={fetch}
    >
      { spyRender }
    </AsyncDataAccess>)

    expect(spyRender).toBeCalledWith(
      expect.objectContaining({
        isFetching: true
      })
    )
  })

  it('processes a transform', async () => {
    const prom = Promise.resolve({ test1: 'data1', test2: 'data2' })
    const fetch = () => prom
    const transform = data => ({ test3: data.test1 })
    const render = () => 'hi'
    const spyRender = jest.fn(render)

    mount(<AsyncDataAccess
      fetch={fetch}
      transform={transform}
    >
      { spyRender }
    </AsyncDataAccess>)

    await prom

    expect(spyRender).toHaveBeenCalledTimes(3)

    // The initial call of render is called but the results never go in to the DOM
    // not sure if this can be tested
    const initialProps = spyRender.mock.calls[0][0]
    // initial call is not fetching
    expect(initialProps.isFetching).toBeFalsy()
    // initial call does not have previous error
    expect(initialProps.lastError).toBeFalsy()
    expect(initialProps.didInvalidate).toBeFalsy()
    expect(initialProps.lastFetchFailed).toBeFalsy()
    expect(initialProps.payload).toBeFalsy()

    const fetchingProps = spyRender.mock.calls[1][0]
    expect(fetchingProps.isFetching).toBeTruthy()
    expect(fetchingProps.lastError).toBeFalsy()
    expect(fetchingProps.didInvalidate).toBeFalsy()
    expect(fetchingProps.lastFetchFailed).toBeFalsy()
    expect(fetchingProps.payload).toBeFalsy()

    const fetchedProps = spyRender.mock.calls[2][0]
    expect(fetchedProps.isFetching).toBeFalsy()
    expect(fetchedProps.lastError).toBeFalsy()
    expect(fetchedProps.didInvalidate).toBeFalsy()
    expect(fetchedProps.lastFetchFailed).toBeFalsy()
    expect(fetchedProps.payload).toEqual({ test3: 'data1' })
  })

  it('handles error from API', async () => {
    const er = new Error('test message')
    const prom = Promise.resolve(er)
    const fetch = () => prom
    const render = () => 'hi'
    const spyRender = jest.fn(render)

    mount(<AsyncDataAccess
      fetch={fetch}
    >
      { spyRender }
    </AsyncDataAccess>)

    await prom

    expect(spyRender).toHaveBeenCalledTimes(3)

    const initialProps = spyRender.mock.calls[0][0]
    expect(initialProps.isFetching).toBeFalsy()
    expect(initialProps.lastError).toBeFalsy()
    expect(initialProps.didInvalidate).toBeFalsy()
    expect(initialProps.lastFetchFailed).toBeFalsy()
    expect(initialProps.payload).toBeFalsy()

    const fetchingProps = spyRender.mock.calls[1][0]
    expect(fetchingProps.isFetching).toBeTruthy()
    expect(fetchingProps.lastError).toBeFalsy()
    expect(fetchingProps.didInvalidate).toBeFalsy()
    expect(fetchingProps.lastFetchFailed).toBeFalsy()
    expect(fetchingProps.payload).toBeFalsy()

    const fetchedProps = spyRender.mock.calls[2][0]
    expect(fetchedProps.isFetching).toBeFalsy()
    expect(fetchedProps.lastError).toEqual('test message')
    // any previous help data/payload is marked invalid after an error
    expect(fetchedProps.didInvalidate).toBeTruthy()
    // after an error, the last fetch is marked as failed
    expect(fetchedProps.lastFetchFailed).toBeTruthy()
    expect(fetchedProps.payload).toBeFalsy()
  })

  it('handles error from API with API message format, calls onError, supports reload', async () => {
    const er = new Error()
    er.response = {
      data: [
        {
          description: 'error message from API'
        }
      ]
    }
    const prom = Promise.resolve(er)
    const fetch = () => prom
    const render = () => 'hi'
    const spyRender = jest.fn(render)
    const onError = jest.fn()

    mount(<AsyncDataAccess
      fetch={fetch}
      onError={onError}
    >
      { spyRender }
    </AsyncDataAccess>)

    // await 3rd call to render and assert that it has an error from the API message format
    await prom

    expect(spyRender).toHaveBeenCalledTimes(3)

    const fetchedProps = spyRender.mock.calls[2][0]
    expect(fetchedProps.isFetching).toBeFalsy()
    expect(fetchedProps.lastError).toEqual('error message from API')
    // any previous help data/payload is marked invalid after an error
    expect(fetchedProps.didInvalidate).toBeTruthy()
    // after an error, the last fetch is marked as failed
    expect(fetchedProps.lastFetchFailed).toBeTruthy()
    expect(fetchedProps.payload).toBeFalsy()

    expect(onError).toHaveBeenCalledTimes(1)

    // trigger a reload and re-await our promise
    fetchedProps.reload()
    await prom

    expect(spyRender).toHaveBeenCalledTimes(5)

    const reloadedProps = spyRender.mock.calls[3][0]
    // reload has triggered an isFetching render
    expect(reloadedProps.isFetching).toBeTruthy()
  })

  it('will re-fetch if fetch or transform changed', async () => {
    const prom = Promise.resolve({ test1: 'data1', test2: 'data2' })
    const fetch = () => prom
    const render = () => 'hi'
    const fetchSpy = jest.fn(fetch)

    const wrapper = mount(<AsyncDataAccess
      fetch={fetchSpy}
    >
      { render }
    </AsyncDataAccess>)

    await prom

    expect(fetchSpy).toHaveBeenCalledTimes(1)

    const newFetch = jest.fn(fetch)
    wrapper.setProps({ fetch: newFetch })

    await prom

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(newFetch).toHaveBeenCalledTimes(1)

    const transform = jest.fn()
    wrapper.setProps({ transform })

    await prom

    expect(newFetch).toHaveBeenCalledTimes(2)
    expect(transform).toHaveBeenCalledTimes(1)
  })
})

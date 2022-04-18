import { ApolloClient } from 'apollo-client'
import gql from 'graphql-tag'
import {
  createTestClient,
  testServerRequired,
  testServerStop,
} from './init-tests'

import AbortController from 'node-abort-controller'
import { required } from '../server/utils'

const sleep = async (ms: number) => new Promise(x => setTimeout(x, ms))

interface Closable {
  close(): void
}

class TestQuery {
  abortController: AbortController
  client: ApolloClient<unknown>

  constructor(options: { useWebSockets: boolean }) {
    this.abortController = new AbortController()
    this.client = createTestClient(options)
  }

  sendQuery() {
    // Wait for non existing transaction.
    // We are using here Date.now as a nonexisting transaction id
    // to prevent apollo optimization on joining same requests.
    //
    this.client
      .query({
        query: gql`
                query {
                    transactions(
                        timeout:60000
                        filter: { id: { eq: "${Date.now()}" } }
                    ) {
                        id
                        in_message { id }
                        block { id }
                    }
                }
            `,
        context: {
          fetchOptions: {
            signal: this.abortController.signal,
          },
        },
      })
      .catch(error => {
        console.log('>>>', error)
      })
  }

  abort() {
    this.abortController.abort()
    ;(this.client as unknown as Closable).close()
  }
}

test.each([true, false])(
  'Release Aborted Requests (webSockets: %s)',
  async useWebSockets => {
    const server = await testServerRequired()
    const collection = required(server.data.transactions)
    const q1 = new TestQuery({ useWebSockets })
    const q2 = new TestQuery({ useWebSockets })
    q1.sendQuery()
    q2.sendQuery()
    await sleep(1000)
    expect(collection.waitForCount).toEqual(2)
    q1.abort()
    await sleep(500)
    expect(collection.waitForCount).toEqual(1)
    q2.abort()
    await sleep(500)
    expect(collection.waitForCount).toEqual(0)
    const client = createTestClient({ useWebSockets })
    const transactions = await client.query({
      query: gql`
        query {
          transactions(orderBy: [{ path: "now", direction: DESC }], limit: 1) {
            id
            in_message {
              id
            }
            block {
              id
            }
            tr_type_name
          }
        }
      `,
    })
    expect(transactions.data.transactions.length).toBeGreaterThan(0)
    ;(client as unknown as Closable).close()
  },
)

test('Many concurrent requests over web socket', async () => {
  await testServerRequired()
  const client = createTestClient({ useWebSockets: true })
  let output = ''

  const originalStdoutWrite = process.stderr.write.bind(process.stderr)

  ;(process.stderr as { write: unknown }).write = (
    chunk: Parameters<typeof originalStdoutWrite>[0],
    encoding: Parameters<typeof originalStdoutWrite>[1],
    callback: Parameters<typeof originalStdoutWrite>[2],
  ) => {
    output += chunk

    return originalStdoutWrite(chunk, encoding, callback)
  }
  await client.query({
    query: gql`
      query {
        transactions(orderBy: [{ path: "now", direction: DESC }], limit: 1) {
          in_message {
            dst_transaction {
              in_message {
                dst_transaction {
                  in_message {
                    dst_transaction {
                      in_message {
                        dst_transaction {
                          id
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
  })
  ;(process.stderr as { write: unknown }).write = originalStdoutWrite
  expect(output.includes('MaxListenersExceededWarning')).toBeFalsy()
  ;(client as unknown as Closable).close()
})

function randomRequest(size: number): { id: string; body: string } {
  return {
    id: Buffer.alloc(32, 1).toString('base64'),
    body: Buffer.alloc(size, 0).toString('base64'),
  }
}

async function postRequest(request: { id: string; body: string }) {
  const client = createTestClient({ useWebSockets: false })
  try {
    await client.mutate({
      mutation: gql`
                mutation {
                    postRequests(requests: [{
                        id: "${request.id}",
                        body: "${request.body}",
                    }])
                }
            `,
    })
  } finally {
    ;(client as unknown as Closable).close()
  }
}

// test('Post request', async () => {
//     await testServerRequired();
//     await postRequest({
//         id: "X8fNRUjvDIE7YYWyiaYSiY8riTVMVhRAe8xS4TIh7D0=",
//         body: "te6ccgECGgEABE4AAueIAWvSSB+FpeP/GXY6O9z/b5XCq8vsZBywv5jQrTEylDNKEZON8KQCfFvWCWAiZaOGVMo6QlyxxHcGznXVWQ6lRQ+VkM259UMewx84HquhMG2GeLnmU2hIEjKRTpii21bFbADAAAAXf3VmAs/////2i1Xz+AYBAQHAAgIDzyAFAwEB3gQAA9AgAEHZVtFzLVx3VYSkhxqQoK+i23IW/OOwUxzeepyrqoWS0LQCJv8A9KQgIsABkvSg4YrtU1gw9KEJBwEK9KQg9KEIAAACASAMCgH8/38h7UTQINdJwgGf0//TAPQF+Gp/+GH4Zvhijhv0BW34anABgED0DvK91wv/+GJw+GNw+GZ/+GHi0wABjhKBAgDXGCD5AVj4QiD4ZfkQ8qjeI/hC+EUgbpIwcN668uBlIdM/0x80MfgjIQG+8rkh+QAg+EqBAQD0DiCRMd6zCwBO8uBm+AAh+EoiAVUByMs/WYEBAPRD+GojBF8E0x8B8AH4R26S8jzeAgEgEg0CAVgRDgEJuOiY/FAPAf74QW6OEu1E0NP/0wD0Bfhqf/hh+Gb4Yt7RcG1vAvhKgQEA9IaVAdcLP3+TcHBw4pEgjjcjIyNvAm8iyCLPC/8hzws/MTEBbyIhpANZgCD0Q28CNCL4SoEBAPR8lQHXCz9/k3BwcOICNTMx6F8DyIIQd0TH4oIQgAAAALHPCx8hEACibyICyx/0AMiCWGAAAAAAAAAAAAAAAADPC2aBA5gizzEBuZZxz0AhzxeVcc9BIc3iIMlx+wBbMMD/jhL4QsjL//hGzwsA+EoB9ADJ7VTef/hnAMW5Fqvn/wgt0cbdqJoEGuk4QDP6f/pgHoC/DU//DD8M3wxRw36Arb8NTgAwCB6B3le64X//DE4fDG4fDM//DDxb3wjSXkZybj8M3F8AGj8IWRl//wjZ4WAfCUA+gBk9qo//DPACASAVEwHXuxXvk1+EFujhLtRNDT/9MA9AX4an/4Yfhm+GLe+kDXDX+V1NHQ03/f1wwAldTR0NIA39EiIiJzyHHPCwEizwoAc89AJM8WI/oCgGnPQHLPQCDJIvsAXwX4SoEBAPSGlQHXCz9/k3BwcOKRIIFACSji34IyIBu5/4SiMBIQGBAQD0WzAx+GreIvhKgQEA9HyVAdcLP3+TcHBw4gI1MzHoXwNfA/hCyMv/+EbPCwD4SgH0AMntVH/4ZwIBIBcWAMe45GGHXwgt0cJdqJoaf/pgHoC/DU//DD8M3wxb2po/CF8IpA3SRg4b115cDL8AHwhZGX//CNnhYB8JQD6AGT2qnwHkH2CEGh2j3ap+AEYfCFkZf/8I2eFgHwlAPoAZPaqP/wzwAgLaGRgALa+ELIy//4Rs8LAPhKAfQAye1U+A/yAIAHWnAhxwCdItBz1yHXCwDAAZCQ4uAh1w0fkvI84VMRwACQ4MEDIoIQ/////byxkvI84AHwAfhHbpLyPN6A==",
//     });
// });

test('Post extra large request with default limit', async () => {
  await testServerStop()
  await testServerRequired()
  try {
    await postRequest(randomRequest(65000))
  } catch (error) {
    expect(error.message.includes('is too large')).toBeTruthy()
  }
})

test('Post extra large request with configured limit', async () => {
  await testServerStop()
  await testServerRequired({
    requests: {
      maxSize: 8000,
    },
  })
  try {
    await postRequest(randomRequest(10000))
  } catch (error) {
    expect(error.message.includes('is too large')).toBeTruthy()
  }
})

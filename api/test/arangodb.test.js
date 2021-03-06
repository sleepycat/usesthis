const { aql } = require('arangojs')
const { db } = require('../src/db')
let vertexData, edgeData

let vertices = db.collection('vertices')
let edges = db.collection('edges')

describe('Arangodb', () => {
  beforeAll(async () => {
    vertexData = require('./data/vertices').vertices
    edgeData = require('./data/edges').edges
  })

  beforeEach(async () => {
    await vertices.import(vertexData)
    await edges.import(edgeData)
  })

  afterEach(async () => {
    await db.truncate()
  })

  it('find vertices and edges collections', async () => {
    let collections = await db.collections()
    let collectionNames = collections.map(c => {
      return c.name
    })
    expect(collectionNames).toContain('vertices')
    expect(collectionNames).toContain('edges')
  })

  it('can query the database with AQL', async () => {
    let vertices = await db.collection('vertices')
    await vertices.save({ hello: 'world' })
    let cursor = await db.query(
      'FOR doc IN vertices FILTER doc.hello == "world" RETURN doc',
    )
    let result = await cursor.next()
    expect(result.hello).toEqual('world')
  })

  it('can insert data', async () => {
    let latLng = { lat: 45.4292652, lng: -75.6900505 }
    let location = {
      lat: 45.4292652,
      lng: -75.6900505,
      type: 'location',
      address: '126 York Street, Ottawa, ON K1N, Canada',
    }
    let query = aql`
      UPSERT ${latLng} INSERT ${location} UPDATE {} IN vertices RETURN NEW
    `
    let cursor = await db.query(query)
    let result = await cursor.all()
    expect(result[0].lat).toEqual(45.4292652)
  })
})

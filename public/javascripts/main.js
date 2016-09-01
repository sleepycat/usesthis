import MediaQuery from 'react-responsive'
import summary from './summary'
import Map from './components/Map'
import React, { PropTypes } from 'react'
import SummaryChart from './components/SummaryChart'
import ReactDOM from 'react-dom'
import Drawer from './components/Drawer'
import {
  Link,
  Router,
  IndexRoute,
  IndexRedirect,
  Route,
  withRouter,
  hashHistory,
} from 'react-router'
import Lokka from 'lokka'
import Transport from 'lokka-transport-http'

const client = new Lokka({ transport: new Transport('/graphql') })

class MapView extends React.Component {

  state = { mapData: [], orgProfiles: []}


  updateMapData(data) {
    return this.setState({mapData: data})
  }

  updateOrgProfile(locationID) {

      client.query(`
          query getLocation($id: ID!) {
            location(id: $id){
              organizations {
                url
                name
                code
                technologies {
                  name
                }
              }
            }
          }
      `, {id: locationID}).then(result => {

         this.setState({orgProfiles: result.location.organizations})

      }, (e) => {

        let opts = {
          message: e.message.split(':')[1],
          info: true,
          fadeout: 3
        }

        this.component.dispatchEvent('mapbox.setflash', opts)

      });
  }

  listTechnologies(summaryData) {
    return summaryData.summary.reduce((prev, curr) => { return prev.concat(curr.name) }, [])
  }

  dispatchEvent(eventName, data) {
    let event = document.createEvent('CustomEvent')
    event.initCustomEvent(eventName, true, false, data)
    document.dispatchEvent(event)
  }

  handleMapBoundsChange(newBounds) {

    client.query(`
	query getLocations($neLat: Float, $neLng: Float, $swLat: Float, $swLng: Float) {
	  locations_within_bounds(ne_lat: $neLat, ne_lng: $neLng, sw_lat: $swLat, sw_lng: $swLng){
	    id
	    lat
	    lng
	    address
	    organizations {
	      url
	      name
	      technologies:languages {
		name
	      }
	    }
	  }
	}
      `, newBounds).then((result) => {
      this.setState({mapData: result.locations_within_bounds})
    }, (e) => {
      this.dispatchEvent('mapbox.setflash', {message: e.message.split(':')[1], info: true, fadeout: 3})
    })

    this.updateRoute(newBounds.zoom, newBounds.center.lat, newBounds.center.lng, this.props.location.query.highlight)
  }

  updateRoute(zoom, lat, lng, highlight = '') {
    let opts = {
      pathname:`/map=${zoom}/${lat}/${lng}`,
      query: {highlight}
    }
    this.props.router.push(opts)
  }

  summaryLabelClickHandler(nameOnLabel) {
    this.props.router.push({pathname: this.props.location.pathname, query: {highlight: nameOnLabel}})
  }

  render() {

    let summaryData = summary(this.state.mapData)
    let highlight = this.props.location.query.highlight || ""
    let browser = {
      width: window.innerWidth || document.body.clientWidth,
      height: window.innerHeight || document.body.clientHeight
    }

    return (
      <div>
        <Drawer contents={ this.state.orgProfiles } />
        <MediaQuery query='(min-width: 60em)'>
          <section id="sidebar">
            <div id='title'>
              Usesth.is
            </div>
            <div id="geocoder-container"></div>
            <SummaryChart labelOnClick={ ::this.summaryLabelClickHandler } width={ 300 } highlight={ highlight }  data={ summaryData } />
          </section>
          <Map
            data={ this.state.mapData }
            router={this.props.router}
            accessToken='pk.eyJ1IjoibWlrZXdpbGxpYW1zb24iLCJhIjoibzRCYUlGSSJ9.QGvlt6Opm5futGhE5i-1kw'
            styleURI='mapbox://styles/mikewilliamson/cil16fkvv008oavm1zj3f4zyu'
            style={{
              zIndex: 0,
              height: '100vh',
              width: '80vw'
            }}
            highlight={ highlight }
            center= {[this.props.params.lng, this.props.params.lat]}
            zoom={this.props.params.zoom}
            onBoundsChange={ ::this.handleMapBoundsChange }
            showOrganizationProfile={ ::this.updateOrgProfile }
          />
        </MediaQuery>
        <MediaQuery query='(max-width: 60em)'>
          <section id="sidebar">
            <div id='title'>
              Usesth.is
            </div>
            <div style={{fontSize: '0.8em', width: '33%'}} id="geocoder-container"></div>
            <SummaryChart labelOnClick={ ::this.summaryLabelClickHandler } highlight={ highlight } width={ 200 } data={ summaryData } />
          </section>
          <Map
            data={ this.state.mapData }
            router={this.props.router}
            accessToken='pk.eyJ1IjoibWlrZXdpbGxpYW1zb24iLCJhIjoibzRCYUlGSSJ9.QGvlt6Opm5futGhE5i-1kw'
            styleURI='mapbox://styles/mikewilliamson/cil16fkvv008oavm1zj3f4zyu'
            style={{
              zIndex: 0,
              height: '100vh',
              width: '100%'
            }}
            highlight={ highlight }
            center= {[this.props.params.lng, this.props.params.lat]}
            zoom={this.props.params.zoom}
            onBoundsChange={ ::this.handleMapBoundsChange }
            showOrganizationProfile={ ::this.updateOrgProfile }
          />
        </MediaQuery>
      </div>
    );
  }
}

class App extends React.Component {


  render() {
    return (
      <main>
        {this.props.children}
      </main>
    );
  }
}

ReactDOM.render(
  <Router history={hashHistory}>
    <Route path="/" component={App} >
      <IndexRedirect to="map=10/37.66552780572411/-122.27593323274039" />
      <Route path="map=:zoom/:lat/:lng" component={ withRouter(MapView) } />
    </Route>
  </Router>
  , document.getElementById('app'))

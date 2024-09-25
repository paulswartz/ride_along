// If you want to use Phoenix channels, run `mix help phx.gen.channel`
// to get started and then uncomment the line below.
// import "./user_socket.js"

// You can include dependencies in two ways.
//
// The simplest option is to put them in assets/vendor and
// import them using relative paths:
//
//     import "../vendor/some-package.js"
//
// Alternatively, you can `npm install some-package --prefix assets` and import
// them using a path starting with the package name:
//
//     import "some-package"
//

// Include phoenix_html to handle method=PUT/DELETE in forms and buttons.
// import 'phoenix_html'
// Establish Phoenix Socket and LiveView configuration.
import { Socket } from 'phoenix'
import { LiveSocket } from 'phoenix_live_view'

// MapLibreGL for maps
import { Map, Popup } from 'maplibre-gl'
import polyline from '@mapbox/polyline'

// Core Web Vitals analytics
import { onCLS, onINP, onLCP } from 'web-vitals'

const sendBeacon = (blob) => {
  const path = window.location.pathname
  const body = JSON.stringify({ ...blob, path });
  // trailing ; is necessary above to avoid JS getting confused -ps
  (navigator.sendBeacon && navigator.sendBeacon('/analytics', body)) ||
      fetch('/analytics', { body, method: 'POST', keepalive: true })
}

window.onerror = (event, source, lineno, colno, error) => {
  const name = error.name
  const message = error.message
  sendBeacon({ source, lineno, colno, name, message })
}

function sendToAnalytics ({ name, value, id }) {
  sendBeacon({ name, value, id })
}

onCLS(sendToAnalytics)
onINP(sendToAnalytics)
onLCP(sendToAnalytics)

const csrfToken = document
  .querySelector("meta[name='csrf-token']")
  .getAttribute('content')

function initializeMap (el) {
  const destination = JSON.parse(el.dataset.destination)

  const map = new Map({
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [destination.lon, destination.lat],
    zoom: 15,
    container: el.id
  })

  map.addImage('location-icon', document.getElementById('location-icon'))
  map.addImage('vehicle-icon', document.getElementById('vehicle-icon'))

  // new Marker({
  //   element: locationIcon
  // }).setLngLat([lon, lat]).addTo(map)
  //

  const vehicleData = {
    type: 'Feature',
    properties: {
      visibility: 'none',
      vehicleHeading: 0,
      alt: ''
    },
    geometry: {
      type: 'Point',
      coordinates: [destination.lon, destination.lat]
    }
  }

  const polylineData = {
    type: 'Feature',
    properties: {
      visibility: 'none'
    },
    geometry: {
      type: 'LineString',
      coordinates: [[destination.lon, destination.lat]]
    }
  }

  const popup = new Popup({
    className: 'destination-popup',
    offset: [0, -20],
    maxWidth: 250,
    closeButton: false,
    closeOnClick: false,
    closeOnMove: false
  })

  function callback () {
    if (el.dataset.polyline) {
      const decoded = polyline.toGeoJSON(el.dataset.polyline)
      const location = decoded.coordinates[0]

      polylineData.properties.visibility = 'visible'
      polylineData.geometry = decoded

      vehicleData.geometry.coordinates = location
      vehicleData.properties.visibility = 'visible'
      vehicleData.properties.vehicleHeading = parseInt(el.dataset.vehicleHeading)
      vehicleData.properties.alt = el.dataset.vehicle
    } else {
      vehicleData.properties.visibility = 'none'
      polylineData.properties.visibility = 'none'
    }

    map.getSource('polyline').setData(polylineData)
    map.getSource('vehicle').setData(vehicleData)
    map.setLayoutProperty('polyline', 'visibility', polylineData.properties.visibility)
    map.setLayoutProperty('vehicle', 'visibility', vehicleData.properties.visibility)

    // fitBounds/setView needs to happen before we can show the popup. not sure why -ps
    if (el.dataset.bbox) {
      map.fitBounds(JSON.parse(el.dataset.bbox), { padding: 48 })
    } else {
      map.flyTo({ center: [destination.lon, destination.lat], zoom: 15 })
    }

    if (el.dataset.popup) {
      popup.setText(el.dataset.popup).setLngLat([destination.lon, destination.lat]).addTo(map)
    } else {
      popup.remove()
    }
  }

  map.on('load', () => {
    map.addSource('destination', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [destination.lon, destination.lat]
        }
      }
    })
      .addSource('vehicle', {
        type: 'geojson',
        data: vehicleData
      })
      .addSource('polyline', {
        type: 'geojson',
        data: polylineData
      })
      .addLayer({
        id: 'polyline',
        type: 'line',
        source: 'polyline',
        layout: {
          visibility: 'none'
        },
        paint: {
          'line-color': 'blue',
          'line-width': 3,
          'line-opacity': 0.8
        }
      })
      .addLayer({
        id: 'destination',
        type: 'symbol',
        source: 'destination',
        layout: {
          'icon-image': 'location-icon'
        }
      })
      .addLayer({
        id: 'vehicle',
        type: 'symbol',
        source: 'vehicle',
        layout: {
          visibility: 'none',
          'icon-image': 'vehicle-icon',
          'icon-rotate': ['get', 'vehicleHeading']
        }
      })

    callback()

    /* global MutationObserver */
    const observer = new MutationObserver(callback)
    observer.observe(el, {
      attributeFilter: ['data-vehicle', 'data-vehicle-heading', 'data-bbox', 'data-polyline', 'data-popup']
    })
  })
}

const mapEl = document.getElementById('map')
if (mapEl) {
  initializeMap(mapEl)
}

window.setTimeout(() => {
  const liveSocket = new LiveSocket('/live', Socket, {
    longPollFallbackMs: 10000,
    params: { _csrf_token: csrfToken }
  })

  // connect if there are any LiveViews on the page
  liveSocket.connect()

// expose liveSocket on window for web console debug logs and latency simulation:
// >> liveSocket.enableDebug()
// >> liveSocket.enableLatencySim(1000)  // enabled for duration of browser session
// >> liveSocket.disableLatencySim()
// window.liveSocket = liveSocket
}, 100)

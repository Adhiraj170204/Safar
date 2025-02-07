    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: c,
        zoom: 8.8
    });

var marker = new mapboxgl.Marker()
.setLngLat(c)
.addTo(map)

map.addControl(new mapboxgl.NavigationControl())   
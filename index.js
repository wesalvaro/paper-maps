const maxMapSize = 640;
const key = "AIzaSyCaZG8svM2nRjgf_jWGsQVkdlXWbxIWmn0";
const distanceThreshold = 200;

const geo = navigator.geolocation;
const getCurrentPosition = promisify(geo.getCurrentPosition, {
  successI: 0,
  errorI: 1,
  context: geo
});

const watchPosition = iteratify(geo.watchPosition, {
  successI: 0,
  errorI: 1,
  context: geo,
  stopper: id => geo.clearWatch(id)
});

const tooClose = (current, updated) =>
  google.maps.geometry.spherical.computeDistanceBetween(current, updated) < distanceThreshold;

const watch = async (it, startCoords) => {
  const input = document.querySelector("input");
  const ratio = innerWidth / innerHeight;
  const width = Math.floor(ratio > 1 ? maxMapSize : maxMapSize * ratio);
  const height = Math.floor(ratio > 1 ? maxMapSize / ratio : maxMapSize);
  let currLatLng = null;

  const updateMap = latLng => {
    if (currLatLng != null && tooClose(currLatLng, latLng)) {
      console.log("Too close");
      return;
    }
    const mapUrl = getMapUrl({
      start: latLng.toUrlValue(),
      dest: encodeURIComponent(input.value || "Jiyugaoka Station"),
      width,
      height
    });
    document.body.style.backgroundImage = `url("${mapUrl}")`;
    currLatLng = latLng;
  };
  updateMap(new google.maps.LatLng(startCoords.latitude, startCoords.longitude));

  for await (const p of it) {
    updateMap(new google.maps.LatLng(p.coords.latitude, p.coords.longitude));
  }
  console.log("done");
};

const mapStyle = 'element:geometry.fill%7Cvisibility:off&style=feature:administrative%7Ccolor:0xff0302%7Cvisibility:off&style=feature:administrative.locality%7Celement:geometry.fill%7Cvisibility:on%7Cweight:4.5&style=feature:administrative.locality%7Celement:labels.text%7Ccolor:0x000000%7Cvisibility:on%7Cweight:1&style=feature:landscape%7Cvisibility:off&style=feature:poi%7Cvisibility:off&style=feature:road%7Celement:geometry.stroke%7Ccolor:0x000000&style=feature:road%7Celement:labels.icon%7Ccolor:0x000000%7Cvisibility:off&style=feature:road%7Celement:labels.text%7Cvisibility:off&style=feature:transit%7Celement:labels.icon%7Cvisibility:off&style=feature:transit%7Celement:labels.text%7Cvisibility:off&style=feature:transit.line%7Celement:geometry.fill%7Ccolor:0xff0000%7Cvisibility:on%7Cweight:4.5&style=feature:transit.line%7Celement:geometry.stroke%7Ccolor:0x000000%7Cvisibility:on%7Cweight:4.5&style=feature:transit.station%7Cvisibility:off&style=feature:water%7Celement:geometry.fill%7Ccolor:0x000000%7Cvisibility:on';

const getMapUrl = ({ start, dest, width = 600, height = 448 }) =>
  `https://maps.googleapis.com/maps/api/staticmap?scale=2&size=${width}x${height}&maptype=roadmap&markers=color:0xff0000|size:small|${dest}&path=color:0xff000080|weight:5|${start}|${dest}&key=${key}&style=${mapStyle}`;

let watchIt = null;
const maximumAge = 30000;
const enableHighAccuracy = true;

document.querySelector("button").addEventListener("click", function() {
  if (watchIt == null) {
    watchIt = watchPosition({ maximumAge, enableHighAccuracy });
    getCurrentPosition({ enableHighAccuracy }).then(
      r => watch(watchIt, r.coords),
      e => console.error(e)
    );
    this.classList.add("on");
  } else {
    watchIt.stop();
    watchIt = null;
    this.classList.remove("on");
  }
});

const maxMapSize = 640;
const key = "AIzaSyCaZG8svM2nRjgf_jWGsQVkdlXWbxIWmn0";

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

const tooClose = (current, updated) => true;

const watch = async (it, startCoords) => {
  const input = document.querySelector("input");
  const ratio = innerWidth / innerHeight;
  const width = Math.floor(ratio > 1 ? maxMapSize : maxMapSize * ratio);
  const height = Math.floor(ratio > 1 ? maxMapSize / ratio : maxMapSize);
  let currCoords = null;

  const updateMap = coords => {
    if (currCoords != null && tooClose(currCoords, coords)) {
      return;
    }
    const mapUrl = getMapUrl({
      start: `${coords.latitude},${coords.longitude}`,
      dest: input.value || "Jiyugaoka Station",
      width,
      height
    });
    document.body.style.backgroundImage = `url("${mapUrl}")`;
    currCoords = coords;
  };
  updateMap(startCoords);

  for await (const p of it) {
    updateMap(p.coords);
  }
  console.log("done");
};

const getMapUrl = ({ start, dest, width = 600, height = 448 }) =>
  `https://maps.googleapis.com/maps/api/staticmap?scale=2&size=${width}x${height}&maptype=roadmap&markers=color:0xff0000|size:small|${dest}&path=color:0xff0000ff|weight:5|${start}|${dest}&key=${key}&style=feature:poi|visibility:off&style=feature:landscape|color:0xffffff&style=feature:road|color:0x000000&style=feature:road.arterial|color:0x000000&style=feature:road.local|color:0x000000&style=feature:road|element:labels|visibility:off&style=feature:transit|color:0xff0000&style=feature:transit|element:labels|visibility:off&style=feature:administrative|color:0xff0000|visibility:simplified&style=feature:landscape|element:labels|visibility:off`;

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

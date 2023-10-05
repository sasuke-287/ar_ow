import LatLon from "https://cdn.jsdelivr.net/npm/geodesy@2.2.1/latlon-spherical.min.js";

export class CalcVR {
  constructor() {
    this.distance = 0;
    this.bearing = 0;
    this.newPosition = [0, 0];
    this.currentPosition = [0, 0];
    this.objectSize = "0, 0, 0";
    this.newDistance = 800;
  }

  calcDist(currentPosiArg, targetPosition) {
    const current = new LatLon(currentPosiArg[0], currentPosiArg[1]);
    const target = new LatLon(targetPosition[0], targetPosition[1]);
    this.distance = current.distanceTo(target);
    this.bearing = current.finalBearingTo(target);
    this.currentPosition = currentPosiArg;
  }
  calcNewPosition(currentPosition, bearing, newTargetToDistance) {
    const current = new LatLon(currentPosition[0], currentPosition[1]);
    const calculatedlced = current.destinationPoint(
      newTargetToDistance,
      bearing
    );
    this.newPosition = [calculatedlced.latitude, calculatedlced.longitude];
  }
  calcSizeDist(distance) {
    if (distance <= 1000 && distance >= 500) {
      this.objectSize = "25 25 25";
      this.newDistance = 800;
    } else if (distance > 1000 && distance <= 8000) {
      this.objectSize = "20 20 20";
      this.newDistance = 800 + distance / 1000;
    } else if (distance > 8000 && distance <= 16000) {
      this.objectSize = "18 18 18";
      this.newDistance = 800 + distance / 1000;
    } else if (distance > 16000 && distance <= 20000) {
      this.objectSize = "15 15 15";
      this.newDistance = 800 + distance / 1000;
    } else if (distance > 20000) {
      this.objectSize = "10 10 10";
      this.newDistance = 800 + distance / 1000;
    }
  }
}
window.onload = () => {
  navigator.geolocation.getCurrentPosition(success, error, options);
};

function staticLoadPlaces() {
  return [
    {
      name: "hachiban",
      location: {
        lat: 35.67142999196126,
        lng: 139.77022276452675,
      },
    },
  ];
}

function renderPlaces(places, pos) {
  let scene = document.querySelector("a-scene");
  var crd = pos.coords;
  let cal = new CalcVR();

  places.forEach((place) => {
    let latitude = place.location.lat;
    let longitude = place.location.lng;
    let name = place.name;
    let modelName = place.modelName;
    cal.calcDist([crd.latitude, crd.longitude], [latitude, longitude]);
    console.log(`heading: ${crd.heading}`);
    cal.calcNewPosition(cal.currentPosition, cal.bearing, cal.newDistance);
    cal.calcSizeDist(cal.distance);
    let model = document.createElement("a-ring");
    model.setAttribute("color", "green");
    model.setAttribute("look-at", "[gps-camera]");
    model.setAttribute("radius-inner", "1");
    model.setAttribute("radius-outer", "5");
    model.setAttribute("rotation", "-90 0 0");
    model.setAttribute(
      "gps-entity-place",
      `latitude: ${cal.newPosition[0]}; longitude: ${cal.newPosition[1]};`
    );
    model.setAttribute("scale", `2 2 2`);

    model.addEventListener("loaded", () => {
      window.dispatchEvent(new CustomEvent("gps-entity-place-loaded"));
    });

    scene.appendChild(model);
  });
}
var options = {
  enableHighAccuracy: true,
  timeout: 50000,
  maximumAge: 0,
};

function success(pos) {
  let places = staticLoadPlaces();
  renderPlaces(places, pos);
}

function error(err) {
  console.warn(`ERROR(${err.code}): ${err.message}`);
  alert("Unable to capture current location.");
}

window.addEventListener("deviceorientationabsolute", orientationHandler, true);

function orientationHandler(e) {
  const propaties = [];
  for (var key in e) {
    if (["alpha", "beta", "gamma"].includes(key)) {
      propaties.push(`${key} = ${e[key]}`);
    }
  }
  const propatiesString = propaties.reduce((pre, cur) => pre + `\n` + cur);

  const direction = culcDirection(e.alpha, e.beta, e.gamma);

  const viewString = propatiesString + `\n` + `方角：${direction}`;

  document.getElementById("output").innerText = viewString;
}

function culcDirection(alpha, beta, gamma) {
  const rotY = ((gamma || 0) * Math.PI) / 180;
  const rotX = ((beta || 0) * Math.PI) / 180;
  const rotZ = ((alpha || 0) * Math.PI) / 180;
  const cy = Math.cos(rotY);
  const sy = Math.sin(rotY);
  const sx = Math.sin(rotX);
  const cz = Math.cos(rotZ);
  const sz = Math.sin(rotZ);

  const x = -(sy * cz + cy * sx * sz);
  const y = -(sy * sz - cy * sx * cz);

  const direction = Math.atan2(-x, y) * (180.0 / Math.PI) + 180;
  return direction;
}

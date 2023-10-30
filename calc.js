import LatLon from "https://cdn.jsdelivr.net/npm/geodesy@2.2.1/latlon-spherical.min.js";

var directionWithTarget = {};
var directionView = '';

window.onload = () => {
  if (!navigator.geolocation) return;
  // 1000msで位置情報取得を回す
  setInterval(getPosition, 1000);
  setInterval(culcViewAngle(), 1000);
};

function getPosition() {
  navigator.geolocation.getCurrentPosition(onSuccess, onError);
}

function onSuccess(position) {
  const propaties = [];
  for (var key in position.coords) {
    propaties.push(`${key} = ${position.coords[key]}`);
  }
  const propatiesString = propaties.reduce((pre, cur) => pre + `\n` + cur);

  const { distance, direction } = getDistanceAndDirection(position.coords);

  const viewString =
    propatiesString +
    `\n距離1：${Math.round(distance)}\n方角x:${Math.round(direction.x)}\n方角y:${Math.round(direction.y)}`;

  document.getElementById("debug2").innerText = viewString;

  directionWithTarget = {distance, direction};
}

function onError(error) {
  const propaties = [];
  for (var key in error) {
    propaties.push(`${key} = ${error[key]}`);
  }
  const propatiesString = propaties.reduce((pre, cur) => pre + `\n` + cur);
  document.getElementById("debug2").innerText = propatiesString;
}

// 飲み屋座標
const target = {
  latitude: 35.67142999196126,
  longitude: 139.77022276452675,
  altitude: 45,
};

function getDistanceAndDirection(params) {
  const selfPosition = new LatLon(params.latitude, params.longitude);
  const targetPosition = new LatLon(target.latitude, target.longitude);

  // 2座標間距離
  const distance = selfPosition.distanceTo(targetPosition);

  // 2座標間平面方向角度
  const direction = { x: 0, y: 0 };
  direction.x = convert(selfPosition.finalBearingTo(targetPosition));

  // 2座標間垂直方向角度
  const altitudeDiff = target.altitude - params.altitude;
  direction.y = (Math.atan2(distance, -altitudeDiff) * 180) / Math.PI - 90;

  return { distance, direction };
}

// 北を0とした0~360度系を南を0とした0~360度系に変換
function convert(arg) {
  return (360 - arg + 180) % 360;
}

window.addEventListener("deviceorientationabsolute", orientationHandler, true);

function orientationHandler(e) {
  const propaties = [];
  for (var key in e) {
    if (["alpha", "beta", "gamma"].includes(key)) {
      propaties.push(`${key} = ${Math.round(e[key])}`);
    }
  }
  const propatiesString = propaties.reduce((pre, cur) => pre + `\n` + cur);

  const direction = culcDirection(e.alpha, e.beta, e.gamma);

  const viewString = propatiesString + `\n` + `方角：${Math.round(direction)}`;

  document.getElementById("debug").innerText = viewString;

  directionView = Math.round(direction);
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

function culcViewAngle () {

  document.getElementById("debug3").innerText = Math.abs(directionView - directionWithTarget.direction.x);
  
  if (Math.abs(directionView - directionWithTarget.direction.x) <= 30){
    // 30度以下なら緑円出す
    // document.getElementById("debug3").innerText = `みえてるよ`;
    document.getElementById("near_signal_scope").style.visibility = "hidden";
    document.getElementById("signal_scope").style.visibility = "visible";
  } else if (Math.abs(directionView - directionWithTarget.direction.x) <= 90) {
    // 90度以下なら近接している円出す
    // document.getElementById("debug3").innerText = `ちかいよ`;
    document.getElementById("near_signal_scope").style.visibility = "visible";
    document.getElementById("signal_scope").style.visivility = "hidden";
  } else {
    // それ以外なら出さない
    // document.getElementById("debug3").innerText = `視界外だよ`;
    document.getElementById("near_signal_scope").style.visibility = "hidden";
    document.getElementById("signal_scope").style.visibility = "hidden";
  }
}

import LatLon from "https://cdn.jsdelivr.net/npm/geodesy@2.2.1/latlon-spherical.min.js";

const ua = new UAParser();

var distanceWithTarget = "";
var directionWithTarget = "";
var directionView = "";

// 飲み屋座標
const izakaya = {
  name: "八蛮",
  latitude: 35.67142999196126,
  longitude: 139.77022276452675,
  altitude: 45,
};

// 飲み屋座標
const boardgame = {
  name: "ボドゲ会",
  latitude: 35.667607000000004,
  longitude: 139.7637315,
  altitude: 45,
};

var target = izakaya;

document.getElementById('toggleSwitch').addEventListener('change', function() {
  // トグルスイッチが変更されたときの処理を追加
  if (this.checked) {
    // チェックされている場合の処理
    target = izakaya;
  } else {
    // チェックされていない場合の処理
    target = boardgame;
  }
});

window.onload = () => {
  if (!navigator.geolocation) return;
  // 1000msで位置情報取得を回す
  setInterval(getPosition, 1000);

  init();
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
    `\n距離1：${Math.round(distance)}\n方角x:${Math.round(
      direction.x
    )}\n方角y:${Math.round(direction.y)}`;

  document.getElementById("debug2").innerText = viewString;
  document.getElementById("destination_display").innerText = `${target.name}:`;
  document.getElementById("range_display").innerText = `${Math.round(
    distance
  )}m`;

  distanceWithTarget = distance;
  directionWithTarget = direction;
}

function onError(error) {
  const propaties = [];
  for (var key in error) {
    propaties.push(`${key} = ${error[key]}`);
  }
  const propatiesString = propaties.reduce((pre, cur) => pre + `\n` + cur);
  document.getElementById("debug2").innerText = propatiesString;
}

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

function init() {
  switch (ua.getOS().name) {
    case "Android":
      window.addEventListener(
        "deviceorientationabsolute",
        orientationHandler,
        true
      );
      break;
    case "iOS":
      window.addEventListener("deviceorientation", orientationHandler, true);
      break;
    default:
      alert("スマホでアクセスしてください!");
  }
}

function orientationHandler(e) {
  var absolute = e.absolute;
  var alpha = e.alpha;
  var beta = e.beta;
  var gamma = e.gamma;
  var direction;

  switch (ua.getOS().name) {
    case "Android":
      // deviceorientationabsoluteイベントのalphaを補正
      direction = culcDirection(alpha, beta, gamma);
      break;
    case "iOS":
      direction = e.webkitCompassHeading;
      break;
  }

  const viewString = `方角：${Math.round(direction)}`;

  document.getElementById("debug").innerText = viewString;

  directionView = Math.round(direction);

  culcViewAngle();
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

function culcViewAngle() {
  var angleDifference = Math.abs(
    Math.round(directionWithTarget.x) - directionView
  );

  // 360度をまたいだ時用コード
  if (angleDifference > 180) {
    angleDifference = 360 - angleDifference;
  }

  document.getElementById("debug3").innerText = angleDifference;

  if (angleDifference <= 30) {
    // 30度以下なら緑円を表示
    document.getElementById("near_signal_scope_left").style.visibility =
      "hidden";
    document.getElementById("near_signal_scope_right").style.visibility =
      "hidden";
    document.getElementById("signal_scope").style.visibility = "visible";
    document.getElementById("display").style.visibility = "visible";
  } else if (angleDifference <= 90) {
    // 90度以下なら両側の半円を表示
    document.getElementById("near_signal_scope_left").style.visibility =
      "visible";
    document.getElementById("near_signal_scope_right").style.visibility =
      "visible";
    document.getElementById("signal_scope").style.visibility = "hidden";
    document.getElementById("display").style.visibility = "visible";

    // size max 25vmin ~ min 15vmin
    const nearSignalSize = -0.16 * angleDifference + 30;
    // position max 20vmin ~ min 5vmin
    const nearSignalPosition = 0.25 * angleDifference - 2.5;

    // 両側の半円の大きさと位置を変更する
    document.documentElement.style.setProperty(
      "--near_signal_width_and_height",
      nearSignalSize + "vmin"
    );
    document.documentElement.style.setProperty(
      "--near_signal_left_and_right",
      nearSignalPosition + "vmin"
    );
  } else {
    // それ以外なら出さない
    document.getElementById("near_signal_scope_left").style.visibility =
      "hidden";
    document.getElementById("near_signal_scope_right").style.visibility =
      "hidden";
    document.getElementById("signal_scope").style.visibility = "hidden";
    document.getElementById("display").style.visibility = "hidden";
  }
}

document.body.addEventListener("click", handleClick);

var clickCount = 0;

function handleClick() {
  clickCount++;

  if (clickCount === 5) {
    document.getElementById("debug").style.visibility = "visible";
    document.getElementById("debug2").style.visibility = "visible";
    document.getElementById("debug3").style.visibility = "visible";
  } else if (clickCount === 10) {
    document.getElementById("debug").style.visibility = "hidden";
    document.getElementById("debug2").style.visibility = "hidden";
    document.getElementById("debug3").style.visibility = "hidden";

    clickCount = 0;
  }
}

const canvas = document.getElementById("signal_wave");
const ctx = canvas.getContext("2d");

// 波のパラメータ
const amplitude = 50; // 振幅
var frequency = 0.05; // 周波数
var phase = 0; // 位相
var phasespeed = 0.05;

function drawWave() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 左側の枠線
  ctx.beginPath();
  ctx.moveTo(10, 10); // 開始点の座標
  ctx.lineTo(10, canvas.height - 10); // 終了点の座標
  ctx.lineWidth = 4;
  ctx.stroke();

  // 右側の枠線
  ctx.beginPath();
  ctx.moveTo(canvas.width - 10, 10); // 開始点の座標
  ctx.lineTo(canvas.width - 10, canvas.height - 10); // 終了点の座標
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  for (var x = 0; x < canvas.width; x += 5) {
    const y = amplitude * Math.sin(frequency * x + phase) + canvas.height / 2;
    ctx.lineTo(x, y);
  }
  ctx.strokeStyle = "green";
  ctx.lineWidth = 4;
  ctx.stroke();

  // 位相を更新してアニメーションを実現
  phase += phasespeed;

  requestAnimationFrame(drawWave);
}

drawWave();

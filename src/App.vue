<template></template>

<script setup>
import * as THREE from 'three';
import { ref, onMounted } from 'vue';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import Delaunator from 'delaunator';
import TextUtil from './utils/textUtil';
const textBulider = new TextUtil();

// 创建 场景/相机/渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 10, 8000);
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);

async function fetchAndConvertByteStream() {
  try {
    // 使用 fetch API 获取数据
    let response = await fetch(
      'http://192.168.22.155:8099/yard/stock/data/file?fileName=1_GridContent.txt'
    );

    // 检查请求是否成功
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 将响应数据读取为 ArrayBuffer
    let arrayBuffer = await response.arrayBuffer();

    // 创建 DataView 用于读取 ArrayBuffer
    let dataView = new DataView(arrayBuffer);

    // 计算 float 数组的长度
    let floatArrayLength = arrayBuffer.byteLength / 4;

    // 创建一个数组存储 float 数据
    let floatArray = new Float32Array(floatArrayLength);

    // 将每4个字节转换为一个 float
    for (let i = 0; i < floatArrayLength; i++) {
      const value = dataView.getFloat32(i * 4, true); // true 表示小端字节序
      floatArray[i] = value < 0.1 ? 0 : parseInt(value * 10);
    }

    return floatArray;
  } catch (error) {
    console.error('Error fetching and processing data:', error);
  }
}

const init = () => {
  initScene();
  initCamera();
  createLight();
  creatPlane();
  creatStocklinePlane();
  createText();
  // importPlantModel();
  initHelper();
  // renderLightAndShadow();

  initRenderer();
};

const createText = async () => {
  await textBulider.init();
  const A = await textBulider.createText('A');
  scene.add(A);
};

const creatPlane = () => {
  const planeGeo = new THREE.PlaneGeometry(800, 500, 10, 10);
  const planeMat = new THREE.MeshStandardMaterial({
    wireframe: true,
  });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  console.log(plane);
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);
};

const creatStocklinePlane = () => {
  const StocklinePlaneGeo = new THREE.PlaneGeometry(600, 28, 10, 10);
  const StocklinePlaneMat = new THREE.MeshStandardMaterial({
    wireframe: false,
    color: new THREE.Color('#c2d1e5'),
  });
  const Stockline = new THREE.Mesh(StocklinePlaneGeo, StocklinePlaneMat);
  Stockline.rotation.x = -Math.PI / 2;
  scene.add(Stockline);
};

const createStocklineGeometry = async () => {
  try {
    const yList = await fetchAndConvertByteStream();

    const xCount = 6000;
    const zCount = 280;
    let xList = Array.from({ length: xCount + 1 }, (_, index) => index);
    let zList = Array.from({ length: zCount + 1 }, (_, index) => index);

    let xIndex = 0;
    let zIndex = 0;
    const v3List = [];
    for (let yIndex = 0; yIndex < yList.length; yIndex++) {
      v3List.push(xList[xIndex], yList[yIndex], zList[zIndex]);
      xIndex++;
      if (xIndex == xCount) {
        xIndex = 0;
        zIndex++;
        if (zIndex == zCount) zIndex = 0;
      }
    }
    console.log(v3List);

    const geometry = new THREE.BufferGeometry();

    // 位置信息
    const vertices = new Float32Array(v3List);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    // 索引信息
    // 将三维坐标投影到二维平面，例如忽略 z 坐标
    const projectedPoints = [];
    for (let i = 0; i < v3List.length; i += 3) {
      projectedPoints.push(v3List[i], v3List[i + 2]); // 仅保留 x 和 z
    }
    // 使用 Delaunator 生成索引
    const delaunay = new Delaunator(projectedPoints);
    const indexList = delaunay.triangles;
    geometry.setIndex(new THREE.BufferAttribute(indexList, 1));

    // 自动计算法线
    geometry.computeVertexNormals();

    return geometry;
  } catch (error) {
    console.log(error);
  }
};

const createStocklineMaterial = () => {
  // 顶点着色器
  const vertexShader = `
  precision highp float;
  varying vec3 fPosition;
  varying vec2 vUv;
  varying float noise;

  // 简单的2D噪声函数
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float noise2d(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec4 pos = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * pos;
    fPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    noise = noise2d(position.xz * 0.1); // 调整噪声频率
    vUv = uv;
  }
`;

  // 片段着色器
  const fragmentShader = `
  precision highp float;
  uniform float interval;
  varying vec3 fPosition;
  varying vec2 vUv;
  varying float noise;

  void d_color() {
    float dataY = fPosition.y + noise * 0.1; // 添加噪声
    float dataI = interval;
    if (dataY <= -dataI) {
      gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0); // 蓝色
    } else if (dataY > -dataI && dataY <= 0.0) {
      float g = 1.0 - (-dataY / dataI);
      gl_FragColor = vec4(0.0, g, 1.0, 1.0); // 蓝绿
    } else if (dataY > 0.0 && dataY <= dataI) {
      float g = 1.0 - dataY / dataI;
      gl_FragColor = vec4(0.0, 1.0, g, 1.0); // 绿
    } else if (dataY > dataI && dataY <= 2.0 * dataI) {
      float r = 0.5 * ((dataY - dataI) / dataI);
      gl_FragColor = vec4(r, 1.0, 0.0, 1.0); // 浅绿
    } else if (dataY > 2.0 * dataI && dataY <= 3.0 * dataI) {
      float r = 0.5 + ((dataY - 2.0 * dataI) / dataI) * 0.5;
      gl_FragColor = vec4(r, 1.0, 0.0, 1.0); // 黄
    } else if (dataY > 3.0 * dataI && dataY <= 4.0 * dataI) {
      float g = 1.0 - ((dataY - 3.0 * dataI) / dataI) * (1.0 - 0.76);
      gl_FragColor = vec4(1.0, g, 0.0, 1.0); // 土黄
    } else if (dataY > 4.0 * dataI && dataY <= 5.0 * dataI) {
      float g = 0.76 - ((dataY -  4.0 * dataI) / dataI) * (0.76 - 0.58);
      gl_FragColor = vec4(1.0, g, 0.0, 1.0); // 橙
    } else if (dataY > 5.0 * dataI && dataY <= 6.0 * dataI) {
      float g = 0.58 - ((dataY - 5.0 * dataI) / dataI) * 0.58;
      gl_FragColor = vec4(1.0, g, 0.0, 1.0); // 红
    } else {
      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // 红
    }
  }

  void main(){
    d_color();
  }
`;

  const uniforms = {
    interval: {
      type: 'f',
      value: 10.0, // 设置一个适当的区间值
    },
  };

  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  });

  return material;
};

const createStockline = async () => {
  try {
    const geometry = await createStocklineGeometry();
    const material = createStocklineMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
  } catch (error) {
    console.log(error);
  }
};

// 导入工厂模型
const importPlantModel = () => {
  const loader = new GLTFLoader();
  loader.load(
    '/public/model/silo/e.glb',
    function (gltf) {
      console.log(gltf);
      scene.add(gltf.scene);

      gltf.scene.traverse(function (child) {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            emissive: child.material.color,
            emissiveMap: child.material.map,
          });
        }
      });
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );
};

onMounted(() => {
  init();
  window.addEventListener('resize', onWindowResize);
});

/*
  渲染器设置: 设置尺寸 \ 挂载DOM元素 \ 手工渲染 \ 自动渲染
  */
const initRenderer = () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  // 设置阴影属性
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // 清除所有子元素
  document.body.innerHTML = '';
  document.body.appendChild(renderer.domElement);
  // renderer.render(scene, camera)
  const animate = () => {
    controls.update();
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(animate);
};

//窗口大小变化
const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

/*
场景设置:
*/
const initScene = () => {
  // scene.background = new THREE.Color(0x000000);
  // scene.fog = new THREE.Fog(0xffffff, 1, 500); // 颜色、起始距离、结束距离

  // 天空盒
  const loader = new THREE.CubeTextureLoader();
  const texture = loader
    .setPath('https://www.babylonjs-playground.com/textures/TropicalSunnyDay')
    .load(['_px.jpg', '_nx.jpg', '_py.jpg', '_ny.jpg', '_pz.jpg', '_nz.jpg']);
  scene.background = texture;
};

/*
透视相机设置: 位置与指向
*/
const initCamera = () => {
  camera.position.set(0, 0, 1000);
  camera.lookAt(new THREE.Vector3(10, 10, 10));
};

/*
光线: 环境光
*/
const createLight = () => {
  const ambientLight = new THREE.AmbientLight(0x404040, 1); // 柔和的白光
  scene.add(ambientLight);

  // 设置光源
  const light = new THREE.HemisphereLight(0xffffff, 0x444444); // 半球光
  scene.add(light);

  const directionalLight = new THREE.DirectionalLight(0xffffff); // 定向光
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);
};

/*
辅助对象:
*/
const initHelper = () => {
  const axesHelper = new THREE.AxesHelper(50);
  axesHelper.position.y = 0;
  scene.add(axesHelper);

  // const size = 600; // 坐标格尺寸
  // const divisions = 600; // 坐标格细分次数
  // const gridHelper = new THREE.GridHelper(size, divisions);
  // scene.add(gridHelper);
};

/* 光线与阴影场景 */
const renderLightAndShadow = () => {
  // 接受阴影的平面
  const planeGeometry = new THREE.PlaneGeometry(100, 100);
  const martrail = new THREE.MeshPhongMaterial({
    color: new THREE.Color('#1cd66c'),
    side: THREE.DoubleSide,
  });
  const plane = new THREE.Mesh(planeGeometry, martrail);
  plane.receiveShadow = true; // 接受阴影
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  // 投射阴影的立方体
  const cubeGeometry = new THREE.BoxGeometry(10, 10, 10);
  const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x44aa88 });
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.position.set(0, 10, 0);
  cube.castShadow = true; // 投射阴影
  scene.add(cube);

  // 添加光源
  const light = new THREE.DirectionalLight(0xffffff, 10);
  light.position.set(5, 150, 10);
  light.castShadow = true; // 光源投射阴影
  scene.add(light);
};
</script>

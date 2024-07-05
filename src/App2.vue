<template></template>

<script setup>
import * as THREE from 'three';
import { ref, onMounted } from 'vue';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 创建 场景/相机/渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);

const init = () => {
  initScene();
  initCamera();
  createLight();
  // importPlantModel();
  // initHelper();
  // renderLightAndShadow();
  createCone2();
  initRenderer();
};

const createCone2 = (r =20) => {
  // 顶点着色器
const vertexShader = `
  // 设置浮点数的精度为高精度
  precision highp float;
  // 顶点着色器传递到片元着色器的变量 - 相邻顶点值的平滑插值
  varying vec3 fPosition;
  varying vec2 vUv;

  void main() {
    vec4 pos = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * pos;
    fPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vUv = uv;
  }
`;

// 片段着色器
const fragmentShader = `
  precision highp float;
  uniform float interval;
  varying vec3 fPosition;
  varying vec2 vUv;

  // 简单的噪声函数
  float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  void d_color() {
    float dataY = fPosition.y;
    float dataI = interval;

    // 生成噪声值
    float noise = rand(vUv * 10.0) * 0.1; // 调整噪声强度

    if (dataY <= -dataI) {
      gl_FragColor = vec4(0.0, 0.0, 1.0 + noise, 1.0); // 蓝色
    } else if (dataY > -dataI && dataY <= 0.0) {
      float g = 1.0 - (-dataY / dataI) + noise;
      gl_FragColor = vec4(0.0, g, 1.0, 1.0); // 蓝绿
    } else if (dataY > 0.0 && dataY <= dataI) {
      float g = 1.0 - dataY / dataI + noise;
      gl_FragColor = vec4(0.0, 1.0, g, 1.0); // 绿
    } else if (dataY > dataI && dataY <= 2.0 * dataI) {
      float r = 0.5 * ((dataY - dataI) / dataI) + noise;
      gl_FragColor = vec4(r, 1.0, 0.0, 1.0); // 浅绿
    } else if (dataY > 2.0 * dataI && dataY <= 3.0 * dataI) {
      float r = 0.5 + ((dataY - 2.0 * dataI) / dataI) * 0.5 + noise;
      gl_FragColor = vec4(r, 1.0, 0.0, 1.0); // 黄
    } else if (dataY > 3.0 * dataI && dataY <= 4.0 * dataI) {
      float g = 1.0 - ((dataY - 3.0 * dataI) / dataI) * (1.0 - 0.76) + noise;
      gl_FragColor = vec4(1.0, g, 0.0, 1.0); // 土黄
    } else if (dataY > 4.0 * dataI && dataY <= 5.0 * dataI) {
      float g = 0.76 - ((dataY -  4.0 * dataI) / dataI) * (0.76 - 0.58) + noise;
      gl_FragColor = vec4(1.0, g, 0.0, 1.0); // 橙
    } else if (dataY > 5.0 * dataI && dataY <= 6.0 * dataI) {
      float g = 0.58 - ((dataY - 5.0 * dataI) / dataI) * 0.58 + noise;
      gl_FragColor = vec4(1.0, g, 0.0, 1.0); // 红
    } else {
      gl_FragColor = vec4(1.0, 0.0, 0.0 + noise, 1.0); // 红
    }
  }

  void main(){
    d_color();
  }
`;
  // 创建几何体和自定义材质
  const geometry = new THREE.ConeGeometry(r, r, 32);

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

  // 创建网格
  const cone = new THREE.Mesh(geometry, material);
  scene.add(cone);
};

const createCone = () => {
  // 创建几何体和材质
  const geometry = new THREE.ConeGeometry(15, 5, 32);

  // 创建渐变纹理
  const gradientTexture = new THREE.TextureLoader().load(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/wQACfsD/QXXSwAAAABJRU5ErkJggg=='
  ); // 使用透明 PNG 占位
  const gradientCanvas = document.createElement('canvas');
  gradientCanvas.width = 1;
  gradientCanvas.height = 256;
  const context = gradientCanvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, 'red'); // 底部颜色
  gradient.addColorStop(0.5, 'green'); // 底部颜色
  gradient.addColorStop(1, 'blue'); // 顶部颜色
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1, 256);
  gradientTexture.image = gradientCanvas;
  gradientTexture.needsUpdate = true;

  // 创建粗糙度纹理
  const roughnessTexture = new THREE.TextureLoader().load(
    'https://threejs.org/examples/textures/brick_roughness.jpg'
  ); // 示例粗糙度纹理

  const material = new THREE.MeshStandardMaterial({
    map: gradientTexture,
    roughnessMap: roughnessTexture,
  });

  // 创建网格
  const cone = new THREE.Mesh(geometry, material);
  scene.add(cone);
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
  camera.position.set(0, 120, 100);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
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

  const size = 100; // 坐标格尺寸
  const divisions = 20; // 坐标格细分次数
  const gridHelper = new THREE.GridHelper(size, divisions);
  scene.add(gridHelper);
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

<template>
  <div id="factory"></div>
</template>

<script setup>
import * as THREE from 'three';
import { ref, onMounted } from 'vue';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import TextUtil from '@/utils/TextUtil';
import Stockline from '@/utils/Stockline';
const textBulider = new TextUtil();

// 创建 场景/相机/渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
});
const controls = new OrbitControls(camera, renderer.domElement);

const init = async () => {
  initScene();
  initCamera();
  createLight();
  // creatPlane();
  await textBulider.init();
  createDividingRule();
  importFactoryModel();
  initHelper();

  creatStocklinePlane('A', 0);
  creatStocklinePlane('B', 50);
  creatStocklinePlane('C', 100);
  creatStocklinePlane('D', 150);
  // creatStocklinePlane('E', 200);
  // creatStocklinePlane('F', 250);
  initRenderer();
};

const createDividingRule = (length = 600, scale = 50) => {
  let list = Array.from({ length: length / scale + 1 }, (_, index) => index * scale);
  const group = new THREE.Group();
  list.forEach((count) => {
    const text = textBulider.createText(`${count} m`, {
      size: 8,
      depth: 1,
    });
    text.rotation.x = -Math.PI / 2;
    text.position.x = count;
    group.add(text);
  });
  scene.add(group);
  return group;
};

const creatPlane = () => {
  const planeGeo = new THREE.PlaneGeometry(500, 300, 10, 10);
  planeGeo.translate(500 / 2, -300 / 2, 0);
  const planeMat = new THREE.MeshStandardMaterial({
    wireframe: true,
    color: 0x919191,
  });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 1;
  scene.add(plane);
};

const creatStocklinePlane = async (name = 'A', positionZ = 0) => {
  const width = 400,
    height = 30;
  const stocklinePlaneGeo = new THREE.PlaneGeometry(width, height, 10, 10);
  stocklinePlaneGeo.translate(width / 2, -height / 2, 0);
  const stocklinePlaneMat = new THREE.MeshStandardMaterial({
    wireframe: false,
    color: new THREE.Color('#c3d2e5'),
  });
  // 料线地面
  const stocklinePlane = new THREE.Mesh(stocklinePlaneGeo, stocklinePlaneMat);
  stocklinePlane.rotation.x = -Math.PI / 2;
  // 文字
  const text1 = textBulider.createText(name, {
    size: 20,
    depth: 3,
  });
  text1.rotation.x = -Math.PI / 2;
  text1.position.z = 24;
  text1.position.x = -20;

  const text2 = textBulider.createText(name, {
    size: 20,
    depth: 3,
  });
  text2.rotation.x = -Math.PI / 2;
  text2.position.z = 24;
  text2.position.x = width + 5;
  // 组合
  const group = new THREE.Group();
  group.add(stocklinePlane);
  group.add(text1);
  group.add(text2);
  // 移动
  group.position.z = positionZ;
  scene.add(group);

  // 料线
  const stockline = new Stockline(name);
  const stocklineMesh = await stockline.createStocklineMesh();
  group.add(stocklineMesh);
  stocklineMesh.position.y = 0.1;
  return group;
};

// 导入工厂模型
const importFactoryModel = () => {
  const loader = new GLTFLoader();
  loader.load(
    '/public/model/silo/d.glb',
    function (gltf) {
      const silo = gltf.scene;
      silo.scale.set(6.2, 6.2, 6.2);
      silo.rotation.y = Math.PI;
      silo.position.x = 230;
      silo.position.z = 130;
      silo.position.y = -0.1;

      scene.add(silo);
      silo.traverse(function (child) {
        if (child.isMesh) {
          // child.frustumCulled = false;
          //模型阴影
          // child.castShadow = true;
          //模型自发光
          child.material.emissive = child.material.color;
          child.material.emissiveMap = child.material.map;
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
  // renderer.shadowMap.enabled = true;
  // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  //
  renderer.physicallyCorrectLights = true;
  renderer.toneMapping = THREE.LinearToneMapping;

  // 清除所有子元素
  // document.body.innerHTML = '';
  document.getElementById('factory').appendChild(renderer.domElement);
  // renderer.render(scene, camera)

  controls.target = new THREE.Vector3(250, 0, 200);
  controls.enableDamping = true;
  controls.enableRotate = true;
  controls.enableZoom = true;
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
  scene.background = new THREE.Color(0x000000);
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
  camera.position.set(250, 100, 400);
  //camera.lookAt(new THREE.Vector3(250, 0, -1000)); //添加控制器无效
};

/*
光线: 环境光
*/
const createLight = () => {
  const ambientLight = new THREE.AmbientLight(0x404040, 2); // 柔和的白光
  scene.add(ambientLight);

  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 2); // 半球光
  scene.add(light);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // 定向光
  directionalLight.position.set(400, 100, 0);
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

// 切换料线材质
const toggleStockLineMaterial = () => {
  const cubes = [];
  scene.traverse((object) => {
    if (object.isMesh && object.name.startsWith('stockline')) {
      cubes.push(object);
    }
  });
  cubes.forEach((item) => {
    item.toggleMaterial();
  });
};
defineExpose({
  toggleStockLineMaterial,
});
</script>

<style lang="scss" scoped>
#factory {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
</style>

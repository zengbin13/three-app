<template>
  <div id="skyBox" ref="skyBoxRef"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as THREE from 'three';

const skyBoxRef = ref(null);

const initScene = () => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();

  renderer.setSize(window.innerWidth, window.innerHeight);

  skyBoxRef.value.appendChild(renderer.domElement);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  camera.position.z = 5;

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  animate();
};

onMounted(() => {
  initScene();
});
</script>

<style>
#skyBox {
  width: 100vw;
  height: 100vh;
}
</style>

<template>
  <StockLineFactory ref="factoryRef"></StockLineFactory>
  <div id="panel">
    <div class="content"><button @click="toggleMaterial">切换</button></div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import StockLineFactory from './components/StockLineFactory.vue';

const factoryRef = ref(null);
const toggleMaterial = () => {
  console.log(factoryRef.value, 111);
  factoryRef.value?.toggleStockLineMaterial();
};
</script>

<style lang="scss" scoped>
#panel {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: fixed;
  z-index: 999;
  top: 0;
  left: 0;
  pointer-events: none; //忽略鼠标事件不影响下层点击
}
.content {
  pointer-events: auto;
}
</style>

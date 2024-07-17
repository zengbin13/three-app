<template>
  <StockLineFactory ref="factoryRef"></StockLineFactory>
  <div id="panel">
    <div class="content">
      <button @click="toggleMaterial" class="shadow-btn">切换材质</button>
      <button @click="toggleMaterial" class="shadow-btn">切换材质</button>
      <button @click="toggleMaterial" class="shadow-btn">切换材质</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import StockLineFactory from './components/StockLineFactory.vue';

const factoryRef = ref(null);
const toggleMaterial = () => {
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
  padding: 20px;
  button {
    cursor: pointer;
  }
  button + button {
    margin-left: 20px;
  }
}

.shadow-btn {
  padding: 10px 20px;
  border: none;
  font-size: 17px;
  color: #fff;
  border-radius: 7px;
  letter-spacing: 4px;
  font-weight: 700;
  text-transform: uppercase;
  transition: 0.5s;
  transition-property: box-shadow;
}

.shadow-btn {
  background: rgb(0, 140, 255);
  box-shadow: 0 0 25px rgb(0, 140, 255);
}

.shadow-btn:hover {
  box-shadow: 0 0 5px rgb(0, 140, 255), 0 0 25px rgb(0, 140, 255), 0 0 50px rgb(0, 140, 255),
    0 0 100px rgb(0, 140, 255);
}
</style>

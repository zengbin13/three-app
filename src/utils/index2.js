async function createStocklineMesh(name) {
  console.log('网格开始', name);
  await createStocklineGeometry(name);
  console.log('网格完成', name);
}
async function createStocklineGeometry(name) {
  console.log('几何体开始', name);
  await fetchAndConvertByteStream(name);
  console.log('几何体完成', name);
}
async function fetchAndConvertByteStream(name) {
  console.log('fetch', name, '开始');

  let response = await fetch('http://localhost:5173/public/text/1_GridContent.txt', {
    responseType: 'arraybuffer',
  });

  console.log('fetch', name, '过程1');

  // 检查请求是否成功
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // 将响应数据读取为 ArrayBuffer
  console.time(`${name}数据arrayBuffer`);
  let arrayBuffer = await response.arrayBuffer();
  console.timeEnd(`${name}数据arrayBuffer`);

  console.log('fetch', name, '过程2');

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

  console.log('fetch', name, '结束');

  return floatArray;
}

createStocklineMesh('A');
createStocklineMesh('B');
createStocklineMesh('C');

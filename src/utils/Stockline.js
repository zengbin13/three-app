import * as THREE from 'three';
import Delaunator from 'delaunator';

export default class Stockline {
  constructor(x = 4000, z = 280) {
    this.v3list = [];
    this.mesh = null;
    this.x = x;
    this.z = z;
  }
  async createStocklineMesh() {
    try {
      const geometry1 = new THREE.PlaneGeometry(800, 400);
      const geometry = await this.createStocklineGeometry();
      const material = this.createStocklineSegmentationMaterial();
      const mesh = new THREE.Mesh(geometry, material);
      this.mesh = mesh;
      return mesh;
    } catch (error) {
      console.log(error);
    }
  }
  async fetchAndConvertByteStream() {
    try {
      // 使用 fetch API 获取数据
      // let response = await fetch('/api/yard/stock/data/file?fileName=1_GridContent.txt');

      let response = await fetch('/public/text/1_GridContent.txt', {
        responseType: 'arraybuffer',
      });
      console.log('数据获取成功');

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
      console.log('数据解析完成');

      return floatArray;
    } catch (error) {
      console.error('Error fetching and processing data:', error);
    }
  }
  async createStocklineGeometry() {
    try {
      const yList = await this.fetchAndConvertByteStream();

      const xCount = this.x;
      const zCount = this.z;
      let xList = Array.from({ length: xCount + 1 }, (_, index) => index);
      let zList = Array.from({ length: zCount + 1 }, (_, index) => index);

      let xIndex = 0;
      let zIndex = 0;
      const v3List = [];
      for (let yIndex = 0; yIndex < yList.length; yIndex++) {
        v3List.push(xList[xIndex] / 10, yList[yIndex] / 10, zList[zIndex] / 10);
        xIndex++;
        if (xIndex == xCount) {
          xIndex = 0;
          zIndex++;
          if (zIndex == zCount) zIndex = 0;
        }
      }
      // console.log(v3List);
      this.v3List = v3List;

      const geometry = new THREE.BufferGeometry();

      // 位置信息
      const vertices = new Float32Array(v3List);
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

      // 索引信息
      // 将三维坐标投影到二维平面，例如忽略 y 坐标
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
  }
  createStocklineMaterial() {
    // 顶点着色器
    const vertexShader = `
  // 指定浮点数的精度为高精度
  precision highp float;
  // 声明varying变量(用于在顶点着色器和片元着色器间传递数据)
  varying vec3 fPosition; // 传递顶点在世界空间中的位置
  varying vec2 vUv; // 传递纹理坐标(UV 坐标)

  void main() {
    // gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    // 将顶点位置从模型空间转换到视图空间
    vec4 pos = modelViewMatrix * vec4(position, 1.0);
    // 将顶点位置从视图空间转换到裁剪空间
    gl_Position = projectionMatrix * pos;
    // 将顶点位置从模型空间转换到世界空间
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

  void d_color() {
    float dataY = fPosition.y;   
    float dataI = interval;
    // if(dataY <= 0.01) {
    //   discard; // 不渲染高度为0的点
    // }
    if (dataY <= -dataI) {
      gl_FragColor = vec4(0, 0, 1.0, 0); // 蓝
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
        value: 1.0, // 设置一个适当的区间值
      },
    };

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    return material;
  }
  createStocklineSegmentationMaterial() {
    // 顶点着色器
    const vertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = vec3(modelMatrix * vec4(position, 1.0));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

    // 片段着色器
    const fragmentShader = `
varying vec3 vNormal;
varying vec3 vPosition;

uniform float metalness;
uniform float roughness;
uniform vec3 lightPosition;
 uniform float segment;
    uniform float length;

// 简单的噪声函数
float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
  float dataX = vPosition.x;   
    float dataY = vPosition.y;   
    float dataS = segment;
    float dataL = length;

      // 计算每段的长度
    float segmentLength = dataL / dataS;
  
    // 计算当前点所在的段的索引
    int segmentIndex = int(floor(dataX / segmentLength));
  
    // 根据段的索引设置基础颜色
    vec3 baseColor;
    if (mod(float(segmentIndex), 2.0) == 0.0) {
        // 偶数索引
        baseColor = vec3(1.0, 0.0, 0.0); // 红色
    } else {
        // 奇数索引
        baseColor = vec3(0.0, 0.0, 1.0); // 蓝色
    }


  // 基础颜色加噪声
  float noise = rand(gl_FragCoord.xy);
  vec3 color = baseColor + noise * 0.1; // 调整噪声强度

  // 计算光照
  vec3 lightDir = normalize(lightPosition - vPosition);
  float diff = max(dot(vNormal, lightDir), 0.0);
  // 确保背光面不太暗
    float ambient = 0.6; // 环境光强度
    diff += ambient;

  // 金属度和粗糙度的简单处理
  vec3 reflectDir = reflect(-lightDir, vNormal);
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), 16.0);
  vec3 specular = vec3(1.0) * metalness * spec;

  // 最终颜色
  gl_FragColor = vec4(color * diff + specular, 1.0);
}
`;

    // 创建自定义着色器材质
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        segment: { type: 'f', value: 10.0 }, // 段数
        length: { type: 'f', value: 400.0 }, // 长度
        metalness: { value: 1.0 }, // 金属度
        roughness: { value: 0.5 }, // 粗糙度
        lightPosition: { value: new THREE.Vector3(400, 100, 0) },
        baseColor: { value: new THREE.Color(0xff0000) },
      },
    });

    return material;
  }
}

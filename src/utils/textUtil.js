import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export default class TextUtil {
  constructor() {
    // font加载器
    this.fontLoader = new FontLoader();
    this.fontUrl = '/public/fonts/gentilis_bold.typeface.json';
    this.defaultFont = null;
    this.fontLoaded = false; // 标志位
  }
  async init(fontUrl = undefined, options = {}, materialOptions = {}) {
    // 加载默认字体
    this.defaultFont = await this.loadFont(fontUrl);
    this.fontLoaded = true; // 设置标志位

    // 默认几何体参数
    const initOptions = {
      size: 10, //字体大小
      depth: 2, // 挤出文本的厚度
      curveSegments: 12, // 曲线上点的数量。默认值为12
      bevelEnabled: false, // 是否开启斜角，默认为false
      bevelThickness: 10, // 文本上斜角的深度，默认值为20
      bevelSize: 8, //斜角与原始文本轮廓之间的延伸距离。默认值为8
      bevelOffset: 0,
      bevelSegments: 5, // 斜角的分段数。默认值为3
    };
    this.options = {
      ...initOptions,
      options,
    };
    // 默认材质
    const initMaterialOptions = {
      color: 0xffe092,
      flatShading: true,
      wireframe: false, // 默认非线框模式
    };
    this.defaultMaterialOptions = {
      ...initMaterialOptions,
      ...materialOptions,
    };
  }
  loadFont(fontUrl = this.fontUrl) {
    return new Promise((resolve, reject) => {
      this.fontLoader.load(
        fontUrl,
        (font) => {
          resolve(font);
        },
        undefined,
        (error) => {
          console.error('An error occurred loading the font:', error);
          reject(error);
        }
      );
    });
  }
  async createTextAsync(text = '', options = {}, materialOptions = {}, fontUrl = undefined) {
    if (!this.fontLoaded) {
      // 如果字体还没有加载，等待字体加载完成
      await this.init();
    }
    let font = fontUrl ? await loadFont(fontUrl) : this.defaultFont;
    const textGeometry = new TextGeometry(text, {
      font,
      ...this.options,
      ...options,
    });
    const textMaterial = new THREE.MeshPhongMaterial({
      ...this.defaultMaterialOptions,
      ...materialOptions, // 覆盖默认材质选项
    });
    const mesh = new THREE.Mesh(textGeometry, textMaterial);
    return mesh;
  }
  createText(text = '', options = {}, materialOptions = {}) {
    const textGeometry = new TextGeometry(text, {
      font: this.defaultFont,
      ...this.options,
      ...options,
    });
    const textMaterial = new THREE.MeshPhongMaterial({
      ...this.defaultMaterialOptions,
      ...materialOptions, // 覆盖默认材质选项
    });
    const mesh = new THREE.Mesh(textGeometry, textMaterial);
    return mesh;
  }
}

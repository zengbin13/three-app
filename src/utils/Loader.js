import { NearestFilter, TextureLoader, VideoTexture } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// 枚举类型，用于指定加载器类型
export const LoaderType = {
  Texture: 'Texture',
  GLTF: 'GLTF',
  FBX: 'FBX',
  Video: 'Video',
  PLY: 'PLY',
};

// 资源接口
/**
 * @typedef {Object} Resource
 * @property {string} name - 资源名称，作为资源键使用
 * @property {string} type - 加载器类型
 * @property {string} path - 文件路径
 */

export default class Loader {
  constructor() {
    this.resources = {}; // 存储加载的资源
    this.total = 0; // 总资源数
    this.totalSuccess = 0; // 成功加载的资源数
    this.totalFail = 0; // 加载失败的资源数

    // 注册的回调函数
    this.fileLoaded = null; // 文件加载成功时的回调
    this.loadEnd = null; // 所有文件加载完成时的回调

    // 初始化加载器
    // 初始化 GLTF 加载器
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    this.gltfLoader = gltfLoader;

    // 初始化 FBX 加载器
    this.fbxLoader = new FBXLoader();

    // 初始化纹理加载器
    this.textureLoader = new TextureLoader();

    // 初始化 PLY 加载器
    this.plyLoader = new PLYLoader();
  }

  // 加载文件
  /**
   * @param {Array<Resource>} resources - 资源数组
   */
  load(resources) {
    this.total += resources.length;

    for (const resource of resources) {
      if (resource.type === LoaderType.Video) {
        this.loadVideo(resource);
      } else {
        this.loadResource(resource);
      }
    }
  }

  // 注册文件加载成功的回调函数
  /**
   * @param {function(string, any): void} callback - 文件加载成功时的回调
   */
  onFileLoaded(callback) {
    this.fileLoaded = callback;
  }

  // 注册所有文件加载完成的回调函数
  /**
   * @param {function(Object): void} callback - 所有文件加载完成时的回调
   */
  onLoadEnd(callback) {
    this.loadEnd = callback;
  }

  // 加载视频资源
  /**
   * @param {Resource} resource - 视频资源
   */
  loadVideo(resource) {
    const name = resource.name;
    const path = resource.path;

    try {
      const video = document.createElement('video');
      video.src = path;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.loop = true;
      video.play();

      const videoTexture = new VideoTexture(video);
      videoTexture.magFilter = NearestFilter;
      videoTexture.magFilter = NearestFilter;
      videoTexture.generateMipmaps = false;
      //   videoTexture.encoding = sRGBEncoding;

      this.resources[name] = videoTexture;

      this.loadSuccess(resource, videoTexture);
    } catch (err) {
      this.loadFail(resource, err);
    }
  }

  // 加载其他资源
  /**
   * @param {Resource} resource - 资源
   */
  loadResource(resource) {
    const type = resource.type;
    if (!type) {
      console.warn('type is required');
      return;
    }

    let loader = this.textureLoader;

    switch (type) {
      case LoaderType.GLTF:
        loader = this.gltfLoader;
        break;
      case LoaderType.FBX:
        loader = this.fbxLoader;
        break;
      case LoaderType.Texture:
        loader = this.textureLoader;
        break;
      case LoaderType.PLY:
        loader = this.plyLoader;
        break;
      default:
        loader = this.textureLoader;
    }

    loader.load(
      resource.path,
      (res) => {
        this.loadSuccess(resource, res);
      },
      undefined,
      (err) => {
        this.loadFail(resource, err);
      }
    );
  }

  // 文件加载成功
  /**
   * @param {Resource} resource - 资源
   * @param {any} res - 加载的资源
   */
  loadSuccess(resource, res) {
    this.totalSuccess++;

    const name = resource.name;
    this.resources[name] = res;

    this.fileLoaded && this.fileLoaded(name, res);

    // 如果所有文件都加载成功或失败，触发 loadEnd 回调
    if (this.total === this.totalSuccess + this.totalFail) {
      this.loadEnd && this.loadEnd(this.resources);
    }
  }

  // 文件加载失败
  /**
   * @param {Resource} resource - 资源
   * @param {any} err - 错误信息
   */
  loadFail(resource, err) {
    console.warn(`resource ${resource.name} load fail`, err);
    this.totalFail++;

    // 如果所有文件都加载成功或失败，触发 loadEnd 回调
    if (this.total === this.totalSuccess + this.totalFail) {
      this.loadEnd(this.resources);
    }
  }
}

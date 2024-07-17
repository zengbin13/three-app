import { LoaderType } from '@/utils/Loader';

export default [
  {
    name: 'factory',
    type: LoaderType.GLTF,
    path: '/public/model/silo/d.glb',
  },
  {
    name: 'stacker',
    type: LoaderType.FBX,
    path: '/public/model/stacker.fbx',
  },
  // {
  //   name: 'phoenix',
  //   type: LoaderType.GLTF,
  //   path: '/public/model/phoenix_bird.glb',
  // },
];

import * as THREE from 'three';
// import easing from './easing.js';
import metaversefile from 'metaversefile';

const {useApp, useFrame, useActivate, useLoaders, usePhysics, useDropManager, useCleanup} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const dropsUrl = 'https://webaverse.github.io/asset-registry/drops.json';

export default e => {
  const app = useApp();
  const physics = usePhysics();
  const dropManager = useDropManager();

  app.name = 'chest';

  let activateCb = null;
  let frameCb = null;
  useActivate(() => {
    activateCb && activateCb();
  });
  useFrame(() => {
    frameCb && frameCb();
  });

  let live = true;
  const physicsIds = [];
  e.waitUntil((async () => {
    const u = `${baseUrl}chest.glb`;
    let o = await new Promise((accept, reject) => {
      const {gltfLoader} = useLoaders();
      gltfLoader.load(u, accept, function onprogress() {}, reject);
    });
    if (!live) {
      o.destroy();
      return;
    }
    const {animations} = o;
    o = o.scene;
    app.add(o);

    const physicsId = physics.addGeometry(o);
    physicsIds.push(physicsId);

    const mixer = new THREE.AnimationMixer(o);
    const actions = animations.map(animationClip => mixer.clipAction(animationClip));

    const startOffset = 1;
    const endOffset = 2;
    const dropOffset = 1;
    activateCb = () => {
      for (const action of actions) {
        action.reset();
        action.play();
        action.time = startOffset;
      }

      let timeAcc = 0;
      let lastUpdateTime = Date.now();
      let dropped = false;
      function animate() {
        const now = Date.now();
        const timeDiff = (now - lastUpdateTime) / 1000;
        lastUpdateTime = now;

        timeAcc += timeDiff;
        if (!dropped && timeAcc >= dropOffset) {
          // fetch(dropsUrl).then(res => res.json()).then(drops => {
          //   const drop = drops[Math.floor(Math.random() * drops.length)];

          //   dropManager.createDropApp({
          //     type: 'major',
          //     start_url: drop.src,
          //     components: [
          //       {
          //         key: 'appName',
          //         value: drop.name,
          //       },
          //       {
          //         key: 'appUrl',
          //         value: drop.src,
          //       },
          //     ],
          //     position: app.position.clone()
          //       .add(new THREE.Vector3(0, 0.7, 0)),
          //     quaternion: app.quaternion,
          //     scale: app.scale,
          //   });
          // });


          dropManager.createDropApp({
            type: 'major',
            start_url: 'https://webaverse.github.io/machine-gun/index.js',
            components: [
              {
                key: 'appName',
                value: 'Machine Gun',
              },
              {
                key: 'appUrl',
                value: 'https://webaverse.github.io/machine-gun/index.js',
              },
            ],
            position: app.position.clone()
              .add(new THREE.Vector3(0, 0.7, 0)),
            quaternion: app.quaternion,
            scale: app.scale,
          });


          dropped = true;
        }
        if (timeAcc >= endOffset) {
          frameCb = null;
        } else {
          mixer.update(timeDiff);
          mixer.getRoot().updateMatrixWorld();
        }
      }
      frameCb = animate;
    };
  })());

  useCleanup(() => {
    live = false;
    reactApp && reactApp.destroy();
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
  });

  return app;
};

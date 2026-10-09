import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default function TorAvatar({
  mood,
  moving,
  reduced,
  onReady,
}: {
  mood: string;
  moving: boolean;
  reduced: boolean;
  onReady: (ready: boolean) => void;
}) {
  const mount = useRef<HTMLDivElement>(null);
  const current = useRef({ mood, moving, reduced });
  current.current = { mood, moving, reduced };
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let stopped = false,
      renderer: THREE.WebGLRenderer,
      model: THREE.Group | undefined;
    let mixer: THREE.AnimationMixer | undefined,
      active: THREE.AnimationAction | undefined,
      previous = "",
      frame = 0;
    const host = mount.current!;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      onReady(false);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(180, 170);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(36, 180 / 170, 0.1, 30);
    camera.position.set(0, 1.5, 5.2);
    camera.lookAt(0, 1.2, 0);
    scene.add(new THREE.HemisphereLight(0xe5faff, 0x264a68, 3));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(2, 4, 3);
    scene.add(light);
    const rim = new THREE.DirectionalLight(0x39dfff, 2);
    rim.position.set(-3, 2, -2);
    scene.add(rim);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 0.7, 40),
      new THREE.MeshBasicMaterial({
        color: 0x52dce8,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    scene.add(ring);
    const actions: Record<string, THREE.AnimationAction> = {};
    const loader = new GLTFLoader();
    loader.load(
      "/models/tor-robot.glb",
      (gltf) => {
        if (stopped) {
          gltf.scene.traverse((o) => {
            if (o instanceof THREE.Mesh) {
              o.geometry.dispose();
              const materials = Array.isArray(o.material)
                ? o.material
                : [o.material];
              materials.forEach((m) => m.dispose());
            }
          });
          return;
        }
        model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model),
          size = box.getSize(new THREE.Vector3());
        const scale = 2.5 / size.y;
        model.scale.setScalar(scale);
        model.position.y = -box.min.y * scale;
        scene.add(model);
        mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => {
          actions[clip.name] = mixer!.clipAction(clip);
        });
        setLoaded(true);
        onReady(true);
      },
      undefined,
      () => {
        if (!stopped) onReady(false);
      },
    );
    const clock = new THREE.Clock();
    let elapsed = 0,
      gestureUntil = 0;
    const draw = () => {
      if (stopped) return;
      frame = requestAnimationFrame(draw);
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;
      const state = current.current;
      if (model && mixer) {
        if (state.mood !== previous) {
          previous = state.mood;
          gestureUntil = elapsed + 2;
        }
        const gesture =
          state.mood === "happy"
            ? "ThumbsUp"
            : state.mood === "concerned"
              ? "No"
              : state.mood === "cheeky"
                ? "Dance"
                : state.mood === "listening"
                  ? "Yes"
                  : "Wave";
        const clip = state.reduced
          ? "Idle"
          : state.moving
            ? "Walking"
            : elapsed < gestureUntil
              ? gesture
              : "Idle";
        host.dataset.animation = clip;
        const action = actions[clip] || actions.Idle;
        if (active !== action && action) {
          active?.fadeOut(0.2);
          action.reset().fadeIn(0.2).play();
          active = action;
        }
        if (!state.reduced && !document.hidden) mixer.update(dt);
        model.rotation.y = state.reduced
          ? 0
          : state.moving
            ? Math.sin(elapsed * 0.7) * 0.35
            : Math.sin(elapsed * 0.3) * 0.08;
        model.traverse((o) => {
          if (
            o instanceof THREE.Mesh &&
            o.morphTargetDictionary &&
            o.morphTargetInfluences
          ) {
            const dict = o.morphTargetDictionary,
              weights = o.morphTargetInfluences;
            if (dict.Angry !== undefined)
              weights[dict.Angry] = state.mood === "concerned" ? 0.35 : 0;
            if (dict.Sad !== undefined)
              weights[dict.Sad] = state.mood === "thinking" ? 0.2 : 0;
            if (dict.Surprised !== undefined)
              weights[dict.Surprised] =
                state.mood === "speaking"
                  ? 0.2 + Math.abs(Math.sin(elapsed * 12)) * 0.45
                  : state.mood === "listening"
                    ? 0.25
                    : 0;
          }
        });
      }
      if (!document.hidden) renderer.render(scene, camera);
    };
    draw();
    const lost = (e: Event) => {
      e.preventDefault();
      setLoaded(false);
      onReady(false);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      mixer?.stopAllAction();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            m.dispose(),
          );
        }
      });
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div
      ref={mount}
      className="tor-model"
      data-testid="tor-3d"
      data-state={loaded ? "ready" : "loading"}
    />
  );
}

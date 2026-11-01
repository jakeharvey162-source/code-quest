import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * First playable 3D vertical slice. No remote asset services or unverified
 * rewards: the world derives all repairs from the existing C# mission progress.
 * Keep the accessible 2D mission view available alongside this optional mode.
 */
export default function Lagos3DScene({
  repaired,
  reducedMotion,
  onOpenEditor,
  onFallback,
}: {
  repaired: number;
  reducedMotion: boolean;
  onOpenEditor: () => void;
  onFallback: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const keys = useRef(new Set<string>());
  const repairedRef = useRef(repaired);
  const reducedRef = useRef(reducedMotion);
  const openRef = useRef(onOpenEditor);
  const fallbackRef = useRef(onFallback);
  const nearbyRef = useRef(false);
  const [nearby, setNearby] = useState(false);
  const [ready, setReady] = useState(false);
  repairedRef.current = repaired;
  reducedRef.current = reducedMotion;
  openRef.current = onOpenEditor;
  fallbackRef.current = onFallback;

  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "low-power" });
    } catch {
      fallbackRef.current();
      return;
    }
    let disposed = false;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#132f43");
    scene.fog = new THREE.Fog("#132f43", 18, 48);
    const camera = new THREE.PerspectiveCamera(54, 1, 0.1, 65);
    const width = () => Math.max(1, mount.clientWidth);
    const height = () => Math.max(1, mount.clientHeight);
    const resize = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width(), height(), false);
      camera.aspect = width() / height();
      camera.updateProjectionMatrix();
    };
    mount.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-label", "Interactive 3D Lagos city scene");
    renderer.domElement.tabIndex = 0;
    renderer.domElement.style.display = "block";
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();
    scene.add(new THREE.HemisphereLight(0xdff4ff, 0x33402c, 2.2));
    const sun = new THREE.DirectionalLight(0xffdfab, 2.7);
    sun.position.set(-6, 13, 9);
    scene.add(sun);

    const materials = new Set<THREE.Material>();
    const material = (color: string, extra: Record<string, unknown> = {}) => {
      const value = new THREE.MeshStandardMaterial({ color, roughness: 0.72, ...extra });
      materials.add(value);
      return value;
    };
    const asphalt = material("#273f4a");
    const pavement = material("#8b8f79");
    const gold = material("#e8b75c", { metalness: 0.22 });
    const bright = material("#f4e4b0", { emissive: "#bd7d29", emissiveIntensity: 0 });
    const unlit = material("#5d7790");
    const greenery = material("#47765a");
    const stationGlow = material("#64e8e4", { emissive: "#22ccc4", emissiveIntensity: 0.8 });
    const shopSign = material("#7d7a68", { emissive: "#db9638", emissiveIntensity: 0 });
    const antennaSign = material("#577186", { emissive: "#36d4ff", emissiveIntensity: 0 });

    const box = (
      w: number, h: number, d: number,
      x: number, y: number, z: number,
      paint: THREE.Material, parent: THREE.Object3D = scene
    ) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), paint);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    };
    box(24, 0.2, 30, 0, -0.13, 0, greenery);
    box(6.8, 0.05, 30, 0, 0.02, 0, asphalt);
    box(1.4, 0.12, 30, -4.2, 0, 0, pavement);
    box(1.4, 0.12, 30, 4.2, 0, 0, pavement);
    const obstacleBounds: { minX: number; maxX: number; minZ: number; maxZ: number }[] = [];
    const houseColors = ["#e6a17a", "#b7b1cb", "#dfa96a", "#8ba9a0", "#e0c5a2", "#93a6c3"];
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const x = side * (6.0 + (i % 2) * 0.35);
        const z = -8 + i * 8.4;
        const h = 4.1 + (i % 2) * 1.7;
        const facade = material(houseColors[i + (side > 0 ? 3 : 0)]);
        box(3.6, h, 5.8, x, h / 2, z, facade);
        box(3.95, 0.28, 6.1, x, h + 0.13, z, material("#253e47"));
        for (const row of [1.6, 2.8]) {
          for (const offset of [-1, 1]) {
            // Windows face the street; their illumination responds to real repairs.
            box(0.63, 0.85, 0.08, x - side * 1.84, row, z + offset * 1.35, bright);
          }
        }
        box(0.95, 1.9, 0.12, x - side * 1.86, 0.95, z, material("#29434b"));
        obstacleBounds.push({ minX: x - 1.95, maxX: x + 1.95, minZ: z - 3, maxZ: z + 3 });
      }
    }
    // The coding desk is a real selectable scene object, not a fake unlock.
    const station = new THREE.Group();
    station.position.set(0, 0, 0);
    scene.add(station);
    box(2.1, 0.18, 0.9, 0, 0.95, 0, gold, station);
    box(0.15, 1, 0.15, -0.8, 0.46, 0.2, pavement, station);
    box(0.15, 1, 0.15, 0.8, 0.46, 0.2, pavement, station);
    box(1.32, 0.85, 0.14, 0, 1.55, -0.16, material("#213843"), station);
    box(1.16, 0.7, 0.035, 0, 1.55, -0.07, stationGlow, station);
    box(0.75, 0.045, 0.35, 0, 1.07, 0.23, material("#d0d6cc"), station);

    const player = new THREE.Group();
    player.position.set(0, 0, 5.1);
    scene.add(player);
    const shirt = material("#f1b84a");
    const face = material("#bd876b");
    const dark = material("#1d3743");
    box(0.62, 0.96, 0.37, 0, 1.06, 0, shirt, player);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), face);
    head.position.set(0, 1.78, 0);
    player.add(head);
    const leftLeg = box(0.2, 0.66, 0.25, -0.19, 0.32, 0, dark, player);
    const rightLeg = box(0.2, 0.66, 0.25, 0.19, 0.32, 0, dark, player);
    box(0.17, 0.76, 0.24, -0.46, 1.1, 0, face, player);
    box(0.17, 0.76, 0.24, 0.46, 1.1, 0, face, player);

    // Local landmarks react only to the mission progress saved by CodeQuest.
    const lamps: THREE.PointLight[] = [];
    const lampBulbs: THREE.MeshStandardMaterial[] = [];
    const pole = material("#677883", { metalness: 0.35 });
    for (const z of [-8, -3, 5]) {
      for (const x of [-2.9, 2.9]) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);
        scene.add(group);
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.09, 3.8, 8), pole);
        shaft.position.set(0, 1.9, 0);
        group.add(shaft);
        const bulbMat = material("#697e81", { emissive: "#ffd889", emissiveIntensity: 0 });
        lampBulbs.push(bulbMat);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), bulbMat);
        bulb.position.set(x < 0 ? 0.35 : -0.35, 3.72, 0);
        group.add(bulb);
        const light = new THREE.PointLight("#ffe3a0", 0, 4.8, 2);
        light.position.copy(bulb.position);
        group.add(light);
        lamps.push(light);
      }
    }
    box(1.7, 0.55, 0.11, 4.17, 2.5, 0.1, shopSign);
    box(0.65, 0.85, 0.65, -5.7, 6.0, -8, antennaSign);

    // Keep Tor's existing licensed GLB and identity. Fallback is a simple marker.
    const torSpot = new THREE.Group();
    let torMixer: THREE.AnimationMixer | null = null;
    torSpot.position.set(-1.5, 0, -1.5);
    scene.add(torSpot);
    const torMarker = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), stationGlow);
    torMarker.position.y = 1.2;
    torSpot.add(torMarker);
    new GLTFLoader().load("/models/tor-robot.glb", gltf => {
      if (disposed) {
        gltf.scene.traverse(obj => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach(mat => mat.dispose());
          }
        });
        return;
      }
      const bounds = new THREE.Box3().setFromObject(gltf.scene);
      const size = bounds.getSize(new THREE.Vector3());
      const scale = 1.15 / Math.max(size.y, 0.01);
      gltf.scene.scale.setScalar(scale);
      gltf.scene.position.y = -bounds.min.y * scale;
      torSpot.add(gltf.scene);
      torMixer = new THREE.AnimationMixer(gltf.scene);
      const idleClip = gltf.animations.find(clip => /idle/i.test(clip.name)) ?? gltf.animations[0];
      if (idleClip) torMixer.clipAction(idleClip).play();
      torMarker.visible = false;
    }, undefined, () => { /* Keep the marker if offline model download fails. */ });

    let angle = 0;
    let frame = 0;
    const clock = new THREE.Clock();
    const forward = new THREE.Vector3();
    const movement = new THREE.Vector3();
    const destination = new THREE.Vector3();
    const target = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    const cursor = new THREE.Vector2();
    let drag: { x: number; y: number; moved: boolean } | null = null;
    const collides = (x: number, z: number) => {
      if (Math.abs(x) > 3.5 || z < -12.8 || z > 12.8) return true;
      return obstacleBounds.some(o => x > o.minX - 0.35 && x < o.maxX + 0.35
        && z > o.minZ - 0.35 && z < o.maxZ + 0.35);
    };
    const openStation = () => {
      if (nearbyRef.current) openRef.current();
    };
    const onPointerDown = (event: PointerEvent) => {
      renderer.domElement.focus({ preventScroll: true });
      drag = { x: event.clientX, y: event.clientY, moved: false };
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!drag) return;
      const delta = event.clientX - drag.x;
      if (Math.abs(delta) > 2 || Math.abs(event.clientY - drag.y) > 2) drag.moved = true;
      if (drag.moved) angle += delta * 0.005;
      drag.x = event.clientX;
      drag.y = event.clientY;
    };
    const onPointerUp = (event: PointerEvent) => {
      if (drag && !drag.moved) {
        const rect = renderer.domElement.getBoundingClientRect();
        cursor.set(((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(cursor, camera);
        if (raycaster.intersectObjects(station.children, true).length) openStation();
      }
      drag = null;
    };
    const onPointerCancel = () => { drag = null; };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      if (!disposed) fallbackRef.current();
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerCancel);
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      if (document.hidden) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      movement.set(0, 0, 0);
      forward.set(-Math.sin(angle), 0, -Math.cos(angle));
      if (keys.current.has("w") || keys.current.has("arrowup")) movement.add(forward);
      if (keys.current.has("s") || keys.current.has("arrowdown")) movement.sub(forward);
      const side = new THREE.Vector3(forward.z, 0, -forward.x);
      if (keys.current.has("a") || keys.current.has("arrowleft")) movement.add(side);
      if (keys.current.has("d") || keys.current.has("arrowright")) movement.sub(side);
      const moving = movement.lengthSq() > 0;
      if (moving) {
        movement.normalize().multiplyScalar(dt * 3.1);
        const nextX = player.position.x + movement.x;
        const nextZ = player.position.z + movement.z;
        if (!collides(nextX, player.position.z)) player.position.x = nextX;
        if (!collides(player.position.x, nextZ)) player.position.z = nextZ;
        player.rotation.y = Math.atan2(movement.x, movement.z);
      }
      if (!reducedRef.current && moving) {
        leftLeg.rotation.x = Math.sin(clock.elapsedTime * 9) * 0.32;
        rightLeg.rotation.x = -leftLeg.rotation.x;
      } else {
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
      }
      const closeEnough = player.position.distanceTo(station.position) < 2.7;
      if (closeEnough !== nearbyRef.current) {
        nearbyRef.current = closeEnough;
        setNearby(closeEnough);
      }
      const lightsOn = repairedRef.current >= 1;
      lamps.forEach(l => { l.intensity = lightsOn ? 4.2 : 0; });
      lampBulbs.forEach(m => { m.emissiveIntensity = lightsOn ? 2.3 : 0; });
      bright.emissiveIntensity = repairedRef.current >= 1 ? 0.8 : 0;
      shopSign.emissiveIntensity = repairedRef.current >= 2 ? 1.8 : 0;
      antennaSign.emissiveIntensity = repairedRef.current >= 3 ? 2.5 : 0;
      torSpot.position.x += (player.position.x - 1.15 - torSpot.position.x) * Math.min(1, dt * 2.2);
      torSpot.position.z += (player.position.z - 1.65 - torSpot.position.z) * Math.min(1, dt * 2.2);
      if (!reducedRef.current) torMixer?.update(dt);
      target.set(player.position.x, 1.15, player.position.z);
      destination.set(
        player.position.x + Math.sin(angle) * 7.5,
        5.2,
        player.position.z + Math.cos(angle) * 7.5,
      );
      camera.position.lerp(destination, Math.min(1, dt * 7));
      camera.lookAt(target);
      renderer.render(scene, camera);
    };
    camera.position.set(0, 5.2, 12.6);
    animate();
    setReady(true);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      keys.current.clear();
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerCancel);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      scene.traverse(obj => {
        if (!(obj instanceof THREE.Mesh)) return;
        obj.geometry.dispose();
        const sceneMaterials = Array.isArray(obj.material) ? obj.material : [obj.material];
        sceneMaterials.forEach(mat => mat.dispose());
      });
      materials.forEach(mat => mat.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const move = (direction: string, down: boolean) => {
    if (down) keys.current.add(direction);
    else keys.current.delete(direction);
  };
  return (
    <section
      className="lagos3d"
      aria-label="Playable Lagos coding district"
      data-near-station={nearby ? "true" : "false"}
      tabIndex={0}
      onKeyDown={event => {
        const key = event.key.toLowerCase();
        if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "e"].includes(key)) {
          event.preventDefault();
          event.stopPropagation();
          if (key === "e") { if (!event.repeat && nearbyRef.current) openRef.current(); }
          else move(key, true);
        }
      }}
      onKeyUp={event => move(event.key.toLowerCase(), false)}
      onBlur={() => keys.current.clear()}
    >
      <div className="lagos3d-viewport" ref={host} />
      <div className="lagos3d-overlay" role="status">
        <strong>{ready ? "LAGOS / ROOKIE STREET • 3D PREVIEW" : "Preparing the 3D district…"}</strong>
        <span>{nearby ? "Coding station nearby — press E or Interact" : "Move toward the glowing coding station"}</span>
      </div>
      <div className="lagos3d-controls" aria-label="3D movement controls">
        <div className="lagos3d-pad">
          {(["w", "a", "s", "d"] as const).map((key, index) => (
            <button
              key={key}
              type="button"
              aria-label={["Move forward", "Move left", "Move backward", "Move right"][index]}
              onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); move(key, true); }}
              onPointerUp={() => move(key, false)}
              onPointerCancel={() => move(key, false)}
              onLostPointerCapture={() => move(key, false)}
            >
              {["↑", "←", "↓", "→"][index]}
            </button>
          ))}
        </div>
        <button className="lagos3d-interact" type="button" disabled={!nearby} onClick={() => openRef.current()}>
          Interact with coding station
        </button>
      </div>
      <p className="lagos3d-help">
        Click this world, use WASD or arrow keys to walk, drag to turn the camera, and press E near the terminal.
        On touchscreens use the movement buttons. Complete real C# tests below to repair the city.
      </p>
    </section>
  );
}

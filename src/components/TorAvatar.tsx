import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {clipForMood,mouthLevel} from "../lib/tor-performance.mjs";

/**
 * Uses the existing CC0 RobotExpressive model, never swaps out Tor's identity.
 * Device TTS cannot provide reliable PCM/phonemes; the mouth motion tracks
 * speech start/stop and word boundaries with a natural rhythmic fallback.
 */
export default function TorAvatar({
  mood, moving, reduced, speaking=false, speechBeat=0, gestureClip="", gestureId=0,
  reactionLabel="", onReady,
}: {
  mood:string; moving:boolean; reduced:boolean;
  speaking?:boolean; speechBeat?:number; gestureClip?:string; gestureId?:number;
  reactionLabel?:string; onReady:(ready:boolean)=>void;
}) {
  const mount=useRef<HTMLDivElement>(null);
  const lips=useRef<HTMLDivElement>(null);
  const current=useRef({mood,moving,reduced,speaking,speechBeat,gestureClip,gestureId});
  current.current={mood,moving,reduced,speaking,speechBeat,gestureClip,gestureId};
  const [loaded,setLoaded]=useState(false);
  useEffect(()=>{
    let stopped=false,renderer:THREE.WebGLRenderer;
    let model:THREE.Group|undefined,mixer:THREE.AnimationMixer|undefined;
    let active:THREE.AnimationAction|undefined,frame=0;
    const host=mount.current!;
    try {
      renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"low-power"});
    } catch {
      onReady(false);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    renderer.setSize(180,170);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-hidden","true");
    host.appendChild(renderer.domElement);
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(36,180/170,0.1,30);
    camera.position.set(0,1.5,5.2);
    camera.lookAt(0,1.2,0);
    scene.add(new THREE.HemisphereLight(0xe5faff,0x264a68,3));
    const light=new THREE.DirectionalLight(0xffffff,3);
    light.position.set(2,4,3);
    scene.add(light);
    const rim=new THREE.DirectionalLight(0x39dfff,2);
    rim.position.set(-3,2,-2);
    scene.add(rim);
    const ring=new THREE.Mesh(
      new THREE.RingGeometry(0.5,0.7,40),
      new THREE.MeshBasicMaterial({color:0x52dce8,transparent:true,opacity:.35,side:THREE.DoubleSide}),
    );
    ring.rotation.x=-Math.PI/2; ring.position.y=.02;scene.add(ring);
    const actions:Record<string,THREE.AnimationAction>={};
    let face:THREE.Mesh|undefined;
    new GLTFLoader().load("/models/tor-robot.glb",(gltf)=>{
      if(stopped) {
        gltf.scene.traverse(o=>{
          if(o instanceof THREE.Mesh) {
            o.geometry.dispose();
            (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());
          }
        });
        return;
      }
      model=gltf.scene;
      const box=new THREE.Box3().setFromObject(model);
      const size=box.getSize(new THREE.Vector3());
      const scale=2.5/size.y;
      model.scale.setScalar(scale);
      model.position.y=-box.min.y*scale;
      scene.add(model);
      model.traverse(o=>{
        if(o instanceof THREE.Mesh&&/head|face/i.test(o.name)){
          if(!face || (o.morphTargetDictionary?.Surprised!==undefined))face=o;
        }
      });
      mixer=new THREE.AnimationMixer(model);
      gltf.animations.forEach(clip=>{actions[clip.name]=mixer!.clipAction(clip);});
      setLoaded(true);onReady(true);
    },undefined,()=>{if(!stopped)onReady(false);});
    const clock=new THREE.Clock(),headBox=new THREE.Box3(),headSize=new THREE.Vector3();
    const headCenter=new THREE.Vector3(),projected=new THREE.Vector3();
    let elapsed=0,gestureUntil=0,lastMood="",lastGesture=-1,lastTalking=false,lastClip="",nextIdle=24,idleMove=0;
    const draw=()=>{
      if(stopped)return;
      frame=requestAnimationFrame(draw);
      const dt=Math.min(clock.getDelta(),.05);
      elapsed+=dt;
      const state=current.current;
      if(model&&mixer){
        const effectiveMood=state.speaking?"speaking":state.mood;
        if(state.gestureId!==lastGesture&&state.gestureId>0){
          lastGesture=state.gestureId;
          gestureUntil=elapsed+(state.gestureClip==="Dance"?3.6:2.3);
          lastClip=state.gestureClip||"Wave";
        }else if(effectiveMood!==lastMood&&state.gestureId===0){
          gestureUntil=elapsed+1.7;
          lastClip=clipForMood(effectiveMood);
        }else if(effectiveMood!==lastMood&&elapsed>=gestureUntil){
          gestureUntil=elapsed+1.6;
          lastClip=clipForMood(effectiveMood);
        }
        lastMood=effectiveMood;
        if(!state.reduced&&!state.moving&&!state.speaking&&elapsed>nextIdle&&elapsed>=gestureUntil){
          lastClip=["Wave","Yes","ThumbsUp"][idleMove++%3];
          gestureUntil=elapsed+1.7;
          nextIdle=elapsed+34;
        }
        const desired=state.reduced?"Idle":state.moving?"Walking":
          elapsed<gestureUntil?lastClip:"Idle";
        const clip=actions[desired]?desired:"Idle";
        host.dataset.animation=clip;
        const action=actions[clip];
        if(action&&active!==action){
          active?.fadeOut(.23);
          action.reset().fadeIn(.23).play();
          active=action;
        }
        if(!state.reduced&&!document.hidden)mixer.update(dt);
        model.rotation.x=state.reduced?0:Math.sin(elapsed*.46)*.016;
        model.rotation.y=state.reduced?0:state.moving?
          Math.sin(elapsed*.7)*.35:Math.sin(elapsed*.3)*.08;
        const mouth=mouthLevel(elapsed,state.speaking,state.speechBeat,state.reduced);
        model.traverse(o=>{
          if(!(o instanceof THREE.Mesh)||!o.morphTargetDictionary||!o.morphTargetInfluences)return;
          const dict=o.morphTargetDictionary,w=o.morphTargetInfluences;
          if(dict.Angry!==undefined)w[dict.Angry]=state.mood==="concerned"?.35:0;
          if(dict.Sad!==undefined)w[dict.Sad]=state.mood==="thinking"?.2:0;
          if(dict.Surprised!==undefined)w[dict.Surprised]=state.speaking?.22+mouth*.72:state.mood==="listening"?.2:0;
          for(const name of ["mouthOpen","MouthOpen","jawOpen","viseme_aa","viseme_AA"]){
            if(dict[name]!==undefined)w[dict[name]]=mouth;
          }
        });
        // Project a small mouth to the face instead of attaching it to the UI
        // container. This follows the 3D head even while Tor nods or dances.
        if(lips.current){
          if(face)headBox.setFromObject(face);
          else headBox.setFromObject(model);
          headBox.getSize(headSize);
          headBox.getCenter(headCenter);
          projected.set(
            headCenter.x,
            headBox.min.y+headSize.y*(face ? .29 : .78),
            headBox.max.z+.018,
          ).project(camera);
          const x=(projected.x*.5+.5)*180;
          const y=(-projected.y*.5+.5)*170;
          const visible=x>15&&x<165&&y>10&&y<150;
          lips.current.style.left=x.toFixed(1)+"px";
          lips.current.style.top=y.toFixed(1)+"px";
          lips.current.style.setProperty("--tor-mouth-open",String(.24+mouth*2.9));
          lips.current.style.opacity=visible?(state.speaking?"1":".55"):"0";
        }
        if(state.speaking!==lastTalking){
          host.dataset.talking=state.speaking?"true":"false";
          lastTalking=state.speaking;
        }
      }
      if(!document.hidden)renderer.render(scene,camera);
    };
    draw();
    const lost=(e:Event)=>{e.preventDefault();setLoaded(false);onReady(false);};
    renderer.domElement.addEventListener("webglcontextlost",lost);
    return ()=>{
      stopped=true;cancelAnimationFrame(frame);mixer?.stopAllAction();
      scene.traverse(o=>{
        if(o instanceof THREE.Mesh){
          o.geometry.dispose();
          (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());
        }
      });
      renderer.domElement.removeEventListener("webglcontextlost",lost);
      renderer.dispose();renderer.domElement.remove();
    };
  },[]);
  return (
    <div ref={mount} className="tor-model" data-testid="tor-3d"
         data-state={loaded?"ready":"loading"} data-speaking={speaking?"true":"false"}>
      <div ref={lips} className="tor-3d-mouth" aria-hidden="true"><span/></div>
      {gestureId>0&&reactionLabel&&<span key={gestureId} className="tor-reaction-pop" aria-hidden="true">{reactionLabel}</span>}
    </div>
  );
}

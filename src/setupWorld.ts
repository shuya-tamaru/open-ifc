import "./style.css";
import * as THREE from "three";
import * as OBCF from "@thatopen/components-front";
import * as OBC from "@thatopen/components";

export function setupWorld(container: HTMLElement) {
  const components = new OBC.Components();
  const worlds = components.get(OBC.Worlds);

  const world = worlds.create<
    OBC.SimpleScene,
    OBC.SimpleCamera,
    OBC.SimpleRenderer
  >();

  world.scene = new OBC.SimpleScene(components);
  world.renderer = new OBC.SimpleRenderer(components, container);
  world.camera = new OBC.SimpleCamera(components);

  components.init();

  // ライトなどの基本セットアップ
  world.scene.setup();

  // 背景を透明に
  world.scene.three.background = null;

  return { worlds, world, components };
}

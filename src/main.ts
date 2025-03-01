import "./style.css";
import * as THREE from "three";
import * as BUI from "@thatopen/ui";
import Stats from "stats.js";
import * as OBC from "@thatopen/components";
import { setupWorld } from "./setupWorld";
import { Manager } from "@thatopen/ui";
import * as WEBIFC from "web-ifc";
import * as CUI from "@thatopen/ui-obc";
import * as OBCF from "@thatopen/components-front";

//setup
const container = document.getElementById("container")!;
let { worlds, world, components } = setupWorld(container);
world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);

// 軸ヘルパー追加
const axesHelper = new THREE.AxesHelper(50);
world.scene.three.add(axesHelper);
const grids = components.get(OBC.Grids);
const grid = grids.create(world);

//stats
const stats = new Stats();
stats.showPanel(1);
document.body.append(stats.dom);
stats.dom.style.left = "0px";
stats.dom.style.zIndex = "unset";

const fragments = components.get(OBC.FragmentsManager);
const file = await fetch(
  "https://thatopen.github.io/engine_components/resources/small.frag"
);
const data = await file.arrayBuffer();
const buffer = new Uint8Array(data);
const model = fragments.load(buffer);
world.scene.three.add(model);

const properties = await fetch(
  "https://thatopen.github.io/engine_components/resources/small.json"
);
model.setLocalProperties(await properties.json());

const indexer = components.get(OBC.IfcRelationsIndexer);
const relationsFile = await fetch(
  "https://thatopen.github.io/engine_components/resources/small-relations.json"
);
const relations = indexer.getRelationsMapFromJSON(await relationsFile.text());
indexer.setRelationMap(model, relations);

const hider = components.get(OBC.Hider);

const classifier = components.get(OBC.Classifier);
classifier.byEntity(model);
await classifier.bySpatialStructure(model, {
  isolate: new Set([WEBIFC.IFCBUILDINGSTOREY]),
});
console.log(classifier);

BUI.Manager.init();

const spatialStructures: Record<string, any> = {};
const structureNames = Object.keys(classifier.list.spatialStructures);
for (const name of structureNames) {
  spatialStructures[name] = true;
}

const classes: Record<string, any> = {};
const classNames = Object.keys(classifier.list.entities);
for (const name of classNames) {
  classes[name] = true;
}

const panel = BUI.Component.create<BUI.PanelSection>(() => {
  return BUI.html`
    <bim-panel active label="Hider Tutorial" class="options-menu">
      <bim-panel-section collapsed label="Controls">
      
      <bim-panel-section collapsed label="Floors" name="Floors"">
      </bim-panel-section>
      
      <bim-panel-section collapsed label="Categories" name="Categories"">
      </bim-panel-section>
      
    </bim-panel>
  `;
});

container.append(panel);

const floorSection = panel.querySelector(
  "bim-panel-section[name='Floors']"
) as BUI.PanelSection;

const categorySection = panel.querySelector(
  "bim-panel-section[name='Categories']"
) as BUI.PanelSection;

for (const name in spatialStructures) {
  const panel = BUI.Component.create<BUI.Checkbox>(() => {
    return BUI.html`
      <bim-checkbox checked label="${name}"
        @change="${({ target }: { target: BUI.Checkbox }) => {
          const found = classifier.list.spatialStructures[name];
          if (found && found.id !== null) {
            for (const [_id, model] of fragments.groups) {
              const foundIDs = indexer.getEntityChildren(model, found.id);
              const fragMap = model.getFragmentMap(foundIDs);
              hider.set(target.value, fragMap);
            }
          }
        }}">
      </bim-checkbox>
    `;
  });
  floorSection.append(panel);
}

for (const name in classes) {
  const checkbox = BUI.Component.create<BUI.Checkbox>(() => {
    return BUI.html`
      <bim-checkbox checked label="${name}"
        @change="${({ target }: { target: BUI.Checkbox }) => {
          const found = classifier.find({ entities: [name] });
          hider.set(target.value, found);
        }}">
      </bim-checkbox>
    `;
  });
  categorySection.append(checkbox);
}

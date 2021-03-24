/*
@license
Copyright 2019 Google LLC. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/

import {data} from './data/projection';
import {Point3D, Dataset, PointMetadata} from '../src/data';
import {makeSequences} from './sequences';
import {ScatterGL, RenderMode} from '../src';

const dataPoints: Point3D[] = [];
const metadata: PointMetadata[] = [];
data.projection.forEach((vector, index) => {
  const idx = String(data.labels[index]);
  dataPoints.push(vector);
  metadata.push({
    labelIndex: idx,
    title: data.labelIndex[idx],
    label: data.labelNames[index],
  });
});

const sequences = makeSequences(dataPoints, metadata);
const dataset = new Dataset(dataPoints, metadata);

dataset.setSpriteMetadata({
  spriteImage: 'spritesheet.png',
  singleSpriteSize: [28, 28],
});

let lastSelectedPoints: number[] = [];
let renderMode = 'points';

const containerElement = document.getElementById('container')!;
const messagesElement = document.getElementById('messages')!;

const scatterGL = new ScatterGL(containerElement, {
  onHover: (point: number | null) => {
    if (point) {
        const message = `${data.labelNames[point]}`;
        messagesElement.innerHTML = message;
    } else {
        messagesElement.innerHTML = '';
    }
  },
  onSelect: (points: number[]) => {
    let message = '';
    if (points.length === 0 && lastSelectedPoints.length === 0) {
      message = '🔥 no selection';
    } else if (points.length === 0 && lastSelectedPoints.length > 0) {
      message = '🔥 deselected';
    } else if (points.length === 1) {
      message = `🔥 selected ${points}`;
    } else {
      message = `🔥selected ${points.length} points`;
    }
    console.log(message);
    messagesElement.innerHTML = message;
  },
  renderMode: RenderMode.POINT,
  orbitControls: {
    zoomSpeed: 1.125,
  },
});
scatterGL.render(dataset);

// Add in a resize observer for automatic window resize.
window.addEventListener('resize', () => {
  scatterGL.resize();
});

document
  .querySelectorAll<HTMLInputElement>('input[name="interactions"]')
  .forEach(inputElement => {
    inputElement.addEventListener('change', () => {
      if (inputElement.value === 'pan') {
        scatterGL.setPanMode();
      } else if (inputElement.value === 'select') {
        scatterGL.setSelectMode();
      }
    });
  });

document
  .querySelectorAll<HTMLInputElement>('input[name="render"]')
  .forEach(inputElement => {
    inputElement.addEventListener('change', () => {
      renderMode = inputElement.value;
      if (inputElement.value === 'points') {
        scatterGL.setPointRenderMode();
      } else if (inputElement.value === 'sprites') {
        scatterGL.setSpriteRenderMode();
      } else if (inputElement.value === 'text') {
        scatterGL.setTextRenderMode();
      }
    });
  });

const hues = [...new Array(32)].map((_, i) => Math.floor((255 / 32) * i));

const lightTransparentColorsByLabel = hues.map(
  hue => `hsla(${hue}, 100%, 50%, 0.05)`
);
const heavyTransparentColorsByLabel = hues.map(
  hue => `hsla(${hue}, 100%, 50%, 0.75)`
);
const opaqueColorsByLabel = hues.map(hue => `hsla(${hue}, 100%, 50%, 1)`);

// Override the color for 'Unclustered'
lightTransparentColorsByLabel[31] = 'hsla(0, 0, 50%, 0.05)';
heavyTransparentColorsByLabel[31] = 'hsla(0, 0, 50%, 0.4)';
opaqueColorsByLabel[31] = 'hsla(0, 0, 50%, 1)';

document
  .querySelectorAll<HTMLInputElement>('input[name="color"]')
  .forEach(inputElement => {
    inputElement.addEventListener('change', () => {
      if (inputElement.value === 'default') {
        scatterGL.setPointColorer(null);
      } else if (inputElement.value === 'label') {
        scatterGL.setPointColorer((i, selectedIndices, hoverIndex) => {
          const labelIndex = dataset.metadata![i]['labelIndex'] as number;
          const opaque = renderMode !== 'points';
          if (opaque) {
            return opaqueColorsByLabel[labelIndex];
          } else {
            if (hoverIndex === i) {
              return 'red';
            }

            // If nothing is selected, return the heavy color
            if (selectedIndices.size === 0) {
              if (labelIndex === -1) {
                return 'hsla(0,0%,50%,0.4)';
              }

              return heavyTransparentColorsByLabel[labelIndex];
            }
            // Otherwise, keep the selected points heavy and non-selected light
            else {
              const isSelected = selectedIndices.has(i);
              return isSelected
                ? heavyTransparentColorsByLabel[labelIndex]
                : lightTransparentColorsByLabel[labelIndex];
            }
          }
        });
      }
    });
  });

const dimensionsToggle = document.querySelector<HTMLInputElement>(
  'input[name="3D"]'
)!;
dimensionsToggle.addEventListener('change', (e: any) => {
  const is3D = dimensionsToggle.checked;
  scatterGL.setDimensions(is3D ? 3 : 2);
});

const sequencesToggle = document.querySelector<HTMLInputElement>(
  'input[name="sequences"]'
)!;
sequencesToggle.addEventListener('change', (e: any) => {
  const showSequences = sequencesToggle.checked;
  scatterGL.setSequences(showSequences ? sequences : []);
});

// Set up controls for buttons
const selectRandomButton = document.getElementById('select-random')!;
selectRandomButton.addEventListener('click', () => {
  const randomIndex = Math.floor(dataPoints.length * Math.random());
  scatterGL.select([randomIndex]);
});

const toggleOrbitButton = document.getElementById('toggle-orbit')!;
toggleOrbitButton.addEventListener('click', () => {
  if (scatterGL.isOrbiting()) {
    scatterGL.stopOrbitAnimation();
  } else {
    scatterGL.startOrbitAnimation();
  }
});

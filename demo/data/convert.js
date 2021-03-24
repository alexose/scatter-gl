// Convert Matt's .json format to the .ts format expected here
const fs = require('fs');
const path = require('path');
const file = process.argv[2];

if (file && typeof(file) === 'string'){
    proceed(file);
} else {
    console.log('Usage: node convert.js [filename]');
}

function proceed(file) {
    const data = fs.readFileSync(file, 'utf8');

    const labels = [];
    const labelNames = [];
    const labelIndex = {};
    const projection = [];
    data.split('\n').forEach(line => {
        if (!line.length) return;
        try {
            const obj = JSON.parse(line);
            labelIndex[obj.label] = obj.cluster_name;
            labels.push(obj.label);
            labelNames.push(obj.title);
            projection.push(obj.position);
        } catch(e) {
            console.log("Couldn't parse line " + line);
        }
    });

    const renamed = path.basename(file, '.json') + '.ts';

    fs.writeFileSync(renamed,
`export interface Data {
  labels: number[];
  labelIndex: Record<string, string>;
  labelNames: string[];
  projection: [number, number, number][];
}

export const data: Data = {
    labels: ${JSON.stringify(labels)},
    labelIndex: ${JSON.stringify(labelIndex)},
    labelNames: ${JSON.stringify(labelNames)},
    projection: ${JSON.stringify(projection)},
}`
    );
}



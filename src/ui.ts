import { BaseNode, Knob, KnobSet } from "nodes/baseNode";

const knobs = document.getElementById('knobs') as HTMLDivElement
const knobTemplate = document.getElementById('knob-template') as HTMLTemplateElement;

const createKnobSlider = (label: string, knob: Knob, onChange: () => void) => {
    let newKnob = knobTemplate.content.cloneNode(true) as HTMLElement;
    let labelElem = newKnob.querySelector('label') as HTMLLabelElement;
    let inputElem = newKnob.querySelector('input') as HTMLInputElement;

    labelElem.innerText = label;

    if (knob.logarithmic) {
        inputElem.value =
            ((Math.log(knob.value) - Math.log(knob.lower)) /
             (Math.log(knob.upper) - Math.log(knob.lower))).toString();
    }
    else {
        inputElem.value = ((knob.value - knob.lower) / (knob.upper - knob.lower)).toString();
    }

    inputElem.oninput = inputElem.onchange = e => {
        let val = parseFloat(inputElem.value);

        if (knob.logarithmic) {
            knob.value = Math.exp(Math.log(knob.lower) + val * (Math.log(knob.upper) - Math.log(knob.lower)));
            console.log(knob.lower, knob.upper, knob.value, val);
        } else {
            knob.value = knob.lower + val * (knob.upper - knob.lower);
        }

        onChange();
    };

    knobs.append(newKnob);
    knobs.append(document.createElement('br'));
};

export const createSlidersForNode = <T extends KnobSet>(name: string, node: BaseNode<T>) => {
    for(let k in node.knobs) {
        createKnobSlider(name+' '+k, (node.knobs as any)[k], () => node.update());
    }
}

import './Components/definition-batch-modify-table.scss';

import { Activity } from 'bpmn-moddle';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Field, Form } from 'react-final-form';
import ReactModal from 'react-modal';

import BetterFilterBox from './Components/BetterFilterBox';
import { DefinitionPluginParams } from './types';
import { get, post } from './utils/api';

const initialState: Record<string, any> = {
  instructions: [
    // {
    //   "activityId": "prepareBankTransfer",
    //   "name": "Prepare Bank Transfer",
    //   "type": "cancel"
    // },
    // {
    //   "activityId": "approveInvoice",
    //   "name": "Approve Invoice",
    //   "type": "startBeforeActivity"
    // },
    // {
    //   "activityId": "assignApprover",
    //   "name": "Assign Approver Group",
    //   "type": "startAfterActivity"
    // }
  ],
  viewer: null,
  event: null,
};

const hooks: Record<string, any> = {
  setViewer: (viewer: any) => (initialState.viewer = viewer),
  setInstructions: (instructions: []) => (initialState.instructions = instructions),
  setEvent: (event: any) => (initialState.event = event),
};

let badgeIds: Record<string, string> = {};
let currentElement: any = null;
let overlayId: string | null = null;

const BatchModifyForm: React.FC<DefinitionPluginParams> = ({ api, processDefinitionId, root }) => {
  const [showInstanceModal, setShowInstanceModal] = useState(false);
  const [viewer, setViewer] = useState(initialState.viewer);
  const [instructions, setInstructions] = useState(initialState.instructions);
  const [event, setEvent] = useState(initialState.event);
  hooks.setViewer = setViewer;
  hooks.setInstructions = setInstructions;
  hooks.setEvent = setEvent;

  function deleteInstruction(activityId: string) {
    setInstructions(instructions.filter((instruction: any) => instruction.activityId !== activityId));
  }

  function addInstruction(activityId: string, name: string, instruction: string) {
    setInstructions([
      ...instructions,
      {
        activityId: activityId,
        name: name,
        type: instruction,
      },
    ]);
  }

  function changeInstructionType(index: number, event: any) {
    const updatedInstructions = instructions.map((instruction: any, i: number) => {
      if (i === index) {
        instruction.type = event.target.value;
      }
      return instruction;
    });
    setInstructions(updatedInstructions);
  }

  function hideButton() {
    if (overlayId != null) {
      viewer.get('overlays').remove(overlayId);
    }
  }

  function moveItemUp(index: number) {
    const updatedInstructions = [...instructions];
    const temp = updatedInstructions[index - 1];
    updatedInstructions[index - 1] = updatedInstructions[index];
    updatedInstructions[index] = temp;
    setInstructions(updatedInstructions);
  }

  function moveItemDown(index: number) {
    const updatedInstructions = [...instructions];
    const temp = updatedInstructions[index + 1];
    updatedInstructions[index + 1] = updatedInstructions[index];
    updatedInstructions[index] = temp;
    setInstructions(updatedInstructions);
  }

  useEffect(() => {
    if (viewer) {
      const elementRegistry = viewer.get('elementRegistry');
      elementRegistry.forEach(function (flowElement: any) {
        let badgeId: string | null = badgeIds[flowElement.id] || null;
        const instruction = instructions.find((instruction: any) => instruction.activityId === flowElement.id);
        if (instruction) {
          if (badgeId) {
            viewer.get('overlays').remove(badgeId);
          }

          let position: any = {
            left: -10,
            top: -10,
          };
          if (instruction.type === 'startAfterActivity') {
            position = {
              right: 10,
              top: -10,
            };
          }

          badgeId = viewer.get('overlays').add(flowElement, 'BADGE', {
            position,
            html: `<span class="badge badge-warning">${instruction.type === 'cancel' ? '-' : '+'}</span>`,
          });

          badgeIds[flowElement.id] = badgeId as string;
        } else if (badgeId) {
          viewer.get('overlays').remove(badgeId);
          delete badgeIds[flowElement.id];
        }
      });
    }
  }, [instructions, viewer]);

  useEffect(() => {
    if (viewer && event) {
      const hoverActivities = [
        'bpmn:CallActivity',
        'bpmn:ExclusiveGateway',
        'bpmn:UserTask',
        'bpmn:ServiceTask',
        'bpmn:BusinessRuleTask',
        'bpmn:EndEvent',
        'bpmn:StartEvent',
      ];

      hideButton();

      if (!hoverActivities.includes(event.element.type)) {
        return;
      }

      if (instructions.find((instruction: any) => instruction.activityId == event.element.id)) {
        return;
      }

      currentElement = event.element;

      let button = document.createElement('div');
      createRoot(button!).render(
        <React.StrictMode>
          <select
            onChange={(event: any) =>
              addInstruction(currentElement.id, currentElement.businessObject.name, event.target.value)
            }
          >
            <option>-- Modify</option>
            <option value="cancel">cancel</option>
            <option value="startBeforeActivity">start before</option>
            <option value="startAfterActivity">start after</option>
          </select>
        </React.StrictMode>
      );

      overlayId = viewer.get('overlays').add(event.element, 'INSTRUCTION', {
        position: {
          right: 10,
          bottom: 10,
        },
        html: button,
      });
    }
  }, [event, viewer]);

  return (
    <div>
      <table className="cam-table modification-table">
        <thead>
          <tr>
            <th>Remove</th>
            <th>Order</th>
            <th>Instruction</th>
          </tr>
        </thead>
        <tbody>
          {instructions.map((instruction: any, index: number) => (
            <tr key={index}>
              <td className="remove">
                <div>
                  <button className="btn btn-danger" onClick={() => deleteInstruction(instruction.activityId)}>
                    <span className="glyphicon glyphicon-trash"></span>
                  </button>
                </div>
              </td>
              <td className="order">
                {index > 0 && (
                  <button className="btn btn-sm btn-default arrow-up" onClick={() => moveItemUp(index)}>
                    <span className="glyphicon glyphicon-arrow-up"></span>
                  </button>
                )}
                {index < instructions.length - 1 && (
                  <button className="btn btn-sm btn-default arrow-down" onClick={() => moveItemDown(index)}>
                    <span className="glyphicon glyphicon-arrow-down"></span>
                  </button>
                )}
              </td>
              <td className={`instruction ${instruction.type === 'cancel' ? 'color-cancel' : 'color-move'}`}>
                <div className="color-bar"></div>
                <div className="instruction-container">
                  <div className="instruction-container-row">
                    <select
                      className="form-control"
                      style={{ width: '200px' }}
                      value={instruction.type}
                      onChange={(event: any) => changeInstructionType(index, event)}
                    >
                      <option value="cancel">cancel</option>
                      <option value="startBeforeActivity">start before</option>
                      <option value="startAfterActivity">start after</option>
                    </select>
                    <span>{instruction.name}</span>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div
        style={{
          height: '4em',
          paddingRight: '1em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <button className="btn btn-danger" onClick={() => setShowInstanceModal(true)}>
          Select Instances
        </button>
      </div>
      <ReactModal
        className="modal-dialog"
        isOpen={showInstanceModal}
        style={{
          content: {},
          overlay: {
            zIndex: 2000,
          },
        }}
        ariaHideApp={false}
      >
        <div
          className="modal-content"
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="modal-header">
            <h3>Select Instances to Modify</h3>
          </div>
          <div className="modal-body">asddddddddddd</div>
          <div
            className="model-footer"
            style={{
              height: '4em',
              paddingRight: '1em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <button className="btn btn-default" onClick={() => setShowInstanceModal(false)}>
              Close
            </button>
          </div>
        </div>
      </ReactModal>
    </div>
  );
};

export default [
  {
    id: 'instanceTabModifyDiagram',
    pluginPoint: 'cockpit.processDefinition.diagram.plugin',
    render: (viewer: any) => {
      hooks.setViewer(viewer);
      // console.log(viewer.get('eventBus'));
      viewer.get('eventBus').on('element.hover', (event: any) => hooks.setEvent(event));
      viewer.get('eventBus').on('*', (event: any) => {
        console.log('Event:', event);
      });
    },
  },
  {
    id: 'instanceTabModify',
    pluginPoint: 'cockpit.processDefinition.runtime.tab',
    properties: {
      label: 'Modify',
    },
    render: (node: Element, { api, processDefinitionId }: DefinitionPluginParams) => {
      (async () => {
        createRoot(node!).render(
          <React.StrictMode>
            <BatchModifyForm api={api} processDefinitionId={processDefinitionId} root={node} />
          </React.StrictMode>
        );
      })();
    },
  },
];

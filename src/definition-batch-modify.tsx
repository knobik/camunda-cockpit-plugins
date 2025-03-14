import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ReactModal from 'react-modal';

import ModificationTable from './Components/ModificationTable';
import Portal from './Components/Portal';
import { DefinitionPluginParams, ModificationInstruction } from './types';

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
  tabNode: null,
  event: null,
};

const hooks: Record<string, any> = {
  setViewer: (viewer: any) => (initialState.viewer = viewer),
  setTabNode: (node: Element) => (initialState.tabNode = node),
  setInstructions: (instructions: ModificationInstruction[]) => (initialState.instructions = instructions),
  setEvent: (event: any) => (initialState.event = event),
};

const BatchModifyForm: React.FC<DefinitionPluginParams> = ({ root, api, processDefinitionId }) => {
  const [showInstanceModal, setShowInstanceModal] = useState(false);
  const [viewer, setViewer] = useState(initialState.viewer);
  const [instructions, setInstructions] = useState(initialState.instructions as ModificationInstruction[]);
  const [tabNode, setTabNode] = useState(initialState.tabNode);
  const [event, setEvent] = useState(initialState.event);
  const [badgeIds, setBadgeIds] = useState([] as string[]);
  const [wrenchOverlayId, setWrenchOverlayId] = useState('');

  hooks.setViewer = setViewer;
  hooks.setTabNode = setTabNode;
  hooks.setInstructions = setInstructions;
  hooks.setEvent = setEvent;

  function addInstruction(activityId: string, name: string, instruction: string) {
    setInstructions([
      ...instructions,
      {
        activityId: activityId,
        name: name,
        type: instruction,
      } as ModificationInstruction,
    ]);
  }

  // badges
  useEffect(() => {
    if (viewer) {
      for (const badgeId of badgeIds) {
        viewer.get('overlays').remove(badgeId);
      }

      const overlays = viewer.get('overlays');
      const update: string[] = [];
      instructions.map((instruction: ModificationInstruction) => {
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

        const badgeId = overlays.add(instruction.activityId.split('#')[0], {
          position,
          html: `<span class="badge badge-warning">${instruction.type === 'cancel' ? '-' : '+'}</span>`,
        });
        update.push(badgeId);
      });

      setBadgeIds(update);
    }
  }, [instructions, viewer]);

  // wrench
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

      if (wrenchOverlayId !== '') {
        viewer.get('overlays').remove(wrenchOverlayId);
      }

      if (!hoverActivities.includes(event.element.type)) {
        return;
      }

      if (instructions.find((instruction: any) => instruction.activityId == event.element.id)) {
        return;
      }

      let button = document.createElement('div');
      createRoot(button!).render(
        <React.StrictMode>
          <select
            onChange={(changeEvent: any) => {
              addInstruction(event.element.id, event.element.businessObject.name, changeEvent.target.value);
            }}
          >
            <option>-- Modify</option>
            <option value="cancel">cancel</option>
            <option value="startBeforeActivity">start before</option>
            <option value="startAfterActivity">start after</option>
          </select>
        </React.StrictMode>
      );

      const overlayId: string = viewer.get('overlays').add(event.element, 'INSTRUCTION', {
        position: {
          right: 10,
          bottom: 10,
        },
        html: button,
      });

      setWrenchOverlayId(overlayId);
    }
  }, [event, viewer]);

  return tabNode ? (
    <Portal node={tabNode}>
      <div>
        <ModificationTable instructions={instructions} setInstructions={setInstructions} />
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
    </Portal>
  ) : null;
};

export default [
  {
    id: 'batchModifyDiagram',
    pluginPoint: 'cockpit.processDefinition.diagram.plugin',
    render: (viewer: any) => {
      hooks.setViewer(viewer);
      viewer.get('eventBus').on('element.hover', (event: any) => hooks.setEvent(event));
    },
  },
  {
    id: 'batchModifyTab',
    pluginPoint: 'cockpit.processDefinition.runtime.tab',
    properties: {
      label: 'Modify',
    },
    render: (node: Element) => hooks.setTabNode(node),
  },
  {
    id: 'batchModifyPlugin',
    pluginPoint: 'cockpit.processDefinition.runtime.action',
    render: (node: Element, { api, processDefinitionId }: DefinitionPluginParams) => {
      createRoot(node!).render(
        <React.StrictMode>
          <BatchModifyForm root={node} api={api} processDefinitionId={processDefinitionId} />
        </React.StrictMode>
      );
    },
  },
];

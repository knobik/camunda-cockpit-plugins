import './bootstrap.scss';

import React, { useEffect, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
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
  elementEvent: null,
};

const hooks: Record<string, any> = {
  setViewer: (viewer: any) => (initialState.viewer = viewer),
  setTabNode: (node: Element) => (initialState.tabNode = node),
  setInstructions: (instructions: ModificationInstruction[]) => (initialState.instructions = instructions),
  setElementEvent: (elementEvent: any) => (initialState.elementEvent = elementEvent),
};

const BatchModifyForm: React.FC<DefinitionPluginParams> = ({ api, processDefinitionId }) => {
  const [showInstanceModal, setShowInstanceModal] = useState(false);
  const [viewer, setViewer] = useState(initialState.viewer);
  const [instructions, setInstructions] = useState(initialState.instructions as ModificationInstruction[]);
  const [tabNode, setTabNode] = useState(initialState.tabNode);
  const [elementEvent, setElementEvent] = useState(initialState.elementEvent);
  const [badgeIds, setBadgeIds] = useState([] as string[]);
  const [wrenchOverlayId, setWrenchOverlayId] = useState('');
  const [wrenchDropdownVisible, setWrenchDropdownVisible] = useState(false);

  hooks.setViewer = setViewer;
  hooks.setTabNode = setTabNode;
  hooks.setInstructions = setInstructions;
  hooks.setElementEvent = setElementEvent;

  function addInstruction(activityId: string, name: string, type: string) {
    const update = instructions.find((instruction: ModificationInstruction) => instruction.activityId === activityId);
    if (update) {
      update.type = type;
      setInstructions([...instructions]);
      return;
    }

    setInstructions([
      ...instructions,
      {
        activityId,
        name: name ?? activityId,
        type,
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
    if (viewer && elementEvent) {
      if (wrenchDropdownVisible) {
        return;
      }

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

      if (!hoverActivities.includes(elementEvent.element.type)) {
        return;
      }

      let button = document.createElement('div');
      createRoot(button!).render(
        <React.StrictMode>
          <Dropdown
            onSelect={(eventKey: string | null) =>
              addInstruction(elementEvent.element.id, elementEvent.element.businessObject.name, eventKey as string)
            }
            onToggle={isOpen => setWrenchDropdownVisible(isOpen)}
          >
            <Dropdown.Toggle variant="default" size="sm">
              <span className="glyphicon glyphicon-wrench" />
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item eventKey="cancel">Cancel</Dropdown.Item>
              <Dropdown.Item eventKey="startBeforeActivity">Start Before</Dropdown.Item>
              <Dropdown.Item eventKey="startAfterActivity">Start After</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </React.StrictMode>
      );

      const overlayId: string = viewer.get('overlays').add(elementEvent.element, {
        position: {
          right: 20,
          bottom: 20,
        },
        html: button,
      });

      setWrenchOverlayId(overlayId);
    }
  }, [elementEvent, viewer]);

  return (
    <>
      {tabNode && (
        <Portal node={tabNode}>
          {instructions.length === 0 ? (
            <div style={{ textAlign: 'center' }}>
              <span className="glyphicon glyphicon-wrench" style={{ marginRight: '10px' }}></span>
              Modify the process instance state with the wrench button in the process diagram above.
            </div>
          ) : (
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
            </div>
          )}
        </Portal>
      )}
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
    </>
  );
};

export default [
  {
    id: 'batchModifyDiagram',
    pluginPoint: 'cockpit.processDefinition.diagram.plugin',
    render: (viewer: any) => {
      hooks.setViewer(viewer);
      viewer.get('eventBus').on('element.hover', (event: any) => hooks.setElementEvent(event));

      // viewer.get('eventBus').on('element.hover', (event: any) => console.log('hover', event.element.id));
      // viewer.get('eventBus').on('element.out', (event: any) => console.log('out', event.element.id));

      hooks.setInstructions([]); // reset instructions when switching diagrams
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

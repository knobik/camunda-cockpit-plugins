import './bootstrap.scss';

import React, { useEffect, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import { createRoot } from 'react-dom/client';

import BatchInformationModal from './Components/BatchInformationModal';
import BatchModificationConfirmationModal from './Components/BatchModificationConfirmationModal';
import ModificationTable, { ModificationInstruction } from './Components/ModificationTable';
import Portal from './Components/Portal';
import ProcessInstanceSelectModal, { FilterType } from './Components/ProcessInstanceSelectModal';
import { DefinitionPluginParams } from './types';

const initialState: Record<string, any> = {
  instructions: [
    // {
    //   activityId: "approveInvoice",
    //   name: "Approve Invoice",
    //   type: "cancel"
    // } as ModificationInstruction,
    // {
    //   activityId: "assignApprover",
    //   name: "Assign Approver Group",
    //   type: "startBeforeActivity"
    // } as ModificationInstruction
  ],
  viewer: null,
  tabNode: null,
  elementEvent: null,
  clickedElementEvent: null,
  processDefinitionId: null,
};

const hooks: Record<string, any> = {
  setViewer: (viewer: any) => (initialState.viewer = viewer),
  setTabNode: (node: Element) => (initialState.tabNode = node),
  setInstructions: (instructions: ModificationInstruction[]) => (initialState.instructions = instructions),
  setElementEvent: (elementEvent: any) => (initialState.elementEvent = elementEvent),
  setClickedElementEvent: (elementEvent: any) => (initialState.clickedElementEvent = elementEvent),
  setProcessDefinitionId: (processDefinitionId: string) => (initialState.processDefinitionId = processDefinitionId),
};

const BatchModifyForm: React.FC<DefinitionPluginParams> = ({ api }) => {
  const [showInstanceModal, setShowInstanceModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInformationModal, setShowInformationModal] = useState(false);
  const [batchResponse, setBatchResponse] = useState({} as any);

  const [processDefinitionId, setProcessDefinitionId] = useState(initialState.processDefinitionId);
  const [elementEvent, setElementEvent] = useState(initialState.elementEvent);
  const [clickedElementEvent, setClickedElementEvent] = useState(initialState.clickedElementEvent);
  const [viewer, setViewer] = useState(initialState.viewer);
  const [instructions, setInstructions] = useState(initialState.instructions as ModificationInstruction[]);
  const [tabNode, setTabNode] = useState(initialState.tabNode);
  const [badgeIds, setBadgeIds] = useState([] as string[]);
  const [wrenchOverlayId, setWrenchOverlayId] = useState('');
  const [wrenchDropdownVisible, setWrenchDropdownVisible] = useState(false);

  const [selectedFilterType, setSelectedFilterType] = useState(FilterType.INSTANCE);
  const [selectedProcessInstances, setSelectedProcessInstances] = useState([] as string[]);
  const [selectedQuery, setSelectedQuery] = useState({} as Record<string, any>);

  hooks.setProcessDefinitionId = setProcessDefinitionId;
  hooks.setViewer = setViewer;
  hooks.setTabNode = setTabNode;
  hooks.setInstructions = setInstructions;
  hooks.setElementEvent = setElementEvent;
  hooks.setClickedElementEvent = setClickedElementEvent;

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
    const showOnActivities = [
      'bpmn:CallActivity',
      'bpmn:ExclusiveGateway',
      'bpmn:ParallelGateway',
      'bpmn:EventBasedGateway',
      'bpmn:InclusiveGateway',
      'bpmn:UserTask',
      'bpmn:ServiceTask',
      'bpmn:BusinessRuleTask',
      'bpmn:EndEvent',
      'bpmn:StartEvent',
      'bpmn:IntermediateCatchEvent',
      'bpmn:Task',
      'bpmn:ScriptTask',
      'bpmn:SubProcess',
      'bpmn:IntermediateThrowEvent',
      'bpmn:ManualTask',
      'bpmn:SendTask',
      'bpmn:ReceiveTask',
    ];

    if (viewer && elementEvent) {

      // console.log(elementEvent.element.type);

      // if the user clicked on an element, use that element
      let event = elementEvent;
      if (clickedElementEvent && showOnActivities.includes(clickedElementEvent.element.type)) {
        event = clickedElementEvent;
      }

      if (wrenchDropdownVisible) {
        return;
      }

      if (wrenchOverlayId !== '') {
        viewer.get('overlays').remove(wrenchOverlayId);
      }

      if (!showOnActivities.includes(event.element.type)) {
        return;
      }

      let button = document.createElement('div');
      createRoot(button!).render(
        <React.StrictMode>
          <Dropdown
            onSelect={(eventKey: string | null) =>
              addInstruction(event.element.id, event.element.businessObject.name, eventKey as string)
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

      const overlayId: string = viewer.get('overlays').add(event.element, {
        position: {
          right: 20,
          bottom: 20,
        },
        html: button,
      });

      setWrenchOverlayId(overlayId);
    }
  }, [elementEvent, clickedElementEvent, viewer]);

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

  function completeProcessInstanceSelection(
    filterType: FilterType,
    processInstanceIds: string[] | undefined,
    query: Record<string, any> | undefined
  ) {
    setSelectedFilterType(filterType);
    if (filterType === FilterType.INSTANCE) {
      setSelectedProcessInstances(processInstanceIds as string[]);
      setSelectedQuery({});
    } else {
      setSelectedQuery(query as Record<string, any>);
      setSelectedProcessInstances([]);
    }

    setShowInstanceModal(false);
    setShowConfirmModal(true);
  }

  function onModificationExecuted(asynchronous: boolean, response: any) {
    setBatchResponse(response);

    if (!asynchronous) {
      window.location.reload();
    } else {
      setShowConfirmModal(false);
      setShowInformationModal(true);
    }
  }

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
      <ProcessInstanceSelectModal
        api={api}
        setShowModal={setShowInstanceModal}
        showModal={showInstanceModal}
        processDefinitionId={processDefinitionId}
        onCompleted={completeProcessInstanceSelection}
      />
      <BatchModificationConfirmationModal
        api={api}
        showModal={showConfirmModal}
        setShowModal={setShowConfirmModal}
        processDefinitionId={processDefinitionId}
        instructions={instructions}
        filterType={selectedFilterType}
        selectedProcessInstances={selectedProcessInstances}
        selectedQuery={selectedQuery}
        onBack={() => {
          setShowConfirmModal(false);
          setShowInstanceModal(true);
        }}
        onExecuted={onModificationExecuted}
      />
      <BatchInformationModal
        setShowModal={setShowInformationModal}
        showModal={showInformationModal}
        response={batchResponse}
        content={`Modification is being executed. A new batch with ID ${batchResponse.id} has been created.`}
      />
    </>
  );
};

export default [
  {
    id: 'batchModifyDiagram',
    pluginPoint: 'cockpit.processDefinition.diagram.plugin',
    render: (viewer: any) => {
      hooks.setViewer(viewer);
      viewer.get('eventBus').on('element.click', (event: any) => hooks.setClickedElementEvent(event));
      viewer.get('eventBus').on('element.hover', (event: any) => hooks.setElementEvent(event));
      hooks.setInstructions(initialState.instructions); // reset instructions when switching diagrams
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

      hooks.setProcessDefinitionId(processDefinitionId); // ugly hack to handle version change
    },
  },
];

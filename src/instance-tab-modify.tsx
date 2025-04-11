import './bootstrap.scss';

import React, { useEffect, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import { createRoot } from 'react-dom/client';

import ModificationTable, { ModificationInstruction } from './Components/ModificationTable';
import Portal from './Components/Portal';
import { InstancePluginParams } from './types';
import { post } from './utils/api';

interface Badge {
  activityId: string;
  badgeId: string;
  label: string;
}

const initialState: Record<string, any> = {
  instructions: [
    {
      activityId: "prepareBankTransfer",
      name: "Prepare Bank Transfer",
      type: "cancel",
      activityInstanceIds: [
        'prepareBankTransfer:98d3ed9d-16b6-11f0-ac4d-8ab9cbafd832',
        'prepareBankTransfer:32bb2182-16bd-11f0-ac4d-8ab9cbafd832',
      ]
    } as ModificationInstruction,
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
  processInstanceId: null,
};

const hooks: Record<string, any> = {
  setViewer: (viewer: any) => (initialState.viewer = viewer),
  setTabNode: (node: Element) => (initialState.tabNode = node),
  setInstructions: (instructions: ModificationInstruction[]) => (initialState.instructions = instructions),
  setElementEvent: (elementEvent: any) => (initialState.elementEvent = elementEvent),
  setClickedElementEvent: (elementEvent: any) => (initialState.clickedElementEvent = elementEvent),
  setProcessInstanceId: (processInstanceId: string) => (initialState.processInstanceId = processInstanceId),
};

const BatchModifyForm: React.FC<InstancePluginParams> = ({ api }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInformationModal, setShowInformationModal] = useState(false);
  const [batchResponse, setBatchResponse] = useState({} as any);

  const [processInstanceId, setProcessInstanceId] = useState(initialState.processInstanceId);
  const [elementEvent, setElementEvent] = useState(initialState.elementEvent);
  const [clickedElementEvent, setClickedElementEvent] = useState(initialState.clickedElementEvent);
  const [viewer, setViewer] = useState(initialState.viewer);
  const [instructions, setInstructions] = useState(initialState.instructions as ModificationInstruction[]);
  const [tabNode, setTabNode] = useState(initialState.tabNode);
  const [badges, setBadges] = useState([] as Badge[]);
  const [wrenchOverlayId, setWrenchOverlayId] = useState('');
  const [wrenchDropdownVisible, setWrenchDropdownVisible] = useState(false);

  const [activityInstances, setActivityInstances] = useState([] as any[]);

  hooks.setProcessInstanceId = setProcessInstanceId;
  hooks.setViewer = setViewer;
  hooks.setTabNode = setTabNode;
  hooks.setInstructions = setInstructions;
  hooks.setElementEvent = setElementEvent;
  hooks.setClickedElementEvent = setClickedElementEvent;

  // cache current activityInstances
  useEffect(() => {
    (async () => {
      if (processInstanceId) {
        const response = await post(
          api,
          '/history/activity-instance',
          {},
          JSON.stringify({
            processInstanceId,
            finished: false
          })
        );

        setActivityInstances(response);
      }
    })();
  }, [processInstanceId]);

  // badges
  useEffect(() => {
    if (viewer) {
      for (const badge of badges) {
        viewer.get('overlays').remove(badge.badgeId);
      }

      const overlays = viewer.get('overlays');
      const newBadges: Badge[] = [];
      instructions.map((instruction: ModificationInstruction) => {
        const activityId = instruction.activityId.split('#')[0];
        const label = instruction.type === 'cancel' ? '-' : '+';

        const existingBadges = newBadges.filter(badge => badge.activityId === activityId);
        existingBadges.forEach(badge => overlays.remove(badge.badgeId));

        let labels: string[] = [...existingBadges.map(badge => badge.label), label];
        const badgeId = overlays.add(activityId, {
          position: {
            left: -10,
            top: -10,
          },
          html: `<span class="badge badge-warning">${labels.join(', ')}</span>`,
        });
        newBadges.push({
          activityId,
          badgeId,
          label,
        } as Badge);
      });

      setBadges(newBadges);
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

  function getActivityInstancesByActivityId(activityId: string) {
    return activityInstances.filter(activityInstance => activityInstance.activityId === activityId).map(activityInstance => activityInstance.id);
  }

  function addInstruction(activityId: string, name: string, type: string) {
    let activityInstanceIds: string[] = [];

    if (type === 'cancel') {
      activityInstanceIds = getActivityInstancesByActivityId(activityId);
    }

    setInstructions([
      ...instructions,
      {
        activityId,
        name: name ?? activityId,
        type,
        activityInstanceIds,
      } as ModificationInstruction,
    ]);
  }

  // function onModificationExecuted(asynchronous: boolean, response: any) {
  //   setBatchResponse(response);
  //
  //   if (!asynchronous) {
  //     window.location.reload();
  //   } else {
  //     setShowConfirmModal(false);
  //     setShowInformationModal(true);
  //   }
  // }

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
              <ModificationTable
                batch={false}
                getActivityInstancesByActivityId={getActivityInstancesByActivityId}
                instructions={instructions}
                setInstructions={setInstructions}
              />
              <div
                style={{
                  height: '4em',
                  paddingRight: '1em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                }}
              >
                <button className="btn btn-danger">
                  Apply modifications
                </button>
              </div>
            </div>
          )}
        </Portal>
      )}
      {/*<ProcessInstanceSelectModal*/}
      {/*  api={api}*/}
      {/*  setShowModal={setShowInstanceModal}*/}
      {/*  showModal={showInstanceModal}*/}
      {/*  processInstanceId={processInstanceId}*/}
      {/*  onCompleted={completeProcessInstanceSelection}*/}
      {/*/>*/}
      {/*<BatchModificationConfirmationModal*/}
      {/*  api={api}*/}
      {/*  showModal={showConfirmModal}*/}
      {/*  setShowModal={setShowConfirmModal}*/}
      {/*  processInstanceId={processInstanceId}*/}
      {/*  instructions={instructions}*/}
      {/*  filterType={selectedFilterType}*/}
      {/*  selectedProcessInstances={selectedProcessInstances}*/}
      {/*  selectedQuery={selectedQuery}*/}
      {/*  onBack={() => {*/}
      {/*    setShowConfirmModal(false);*/}
      {/*    setShowInstanceModal(true);*/}
      {/*  }}*/}
      {/*  onExecuted={onModificationExecuted}*/}
      {/*/>*/}
      {/*<BatchInformationModal*/}
      {/*  setShowModal={setShowInformationModal}*/}
      {/*  showModal={showInformationModal}*/}
      {/*  response={batchResponse}*/}
      {/*  content={`Modification is being executed. A new batch with ID ${batchResponse.id} has been created.`}*/}
      {/*/>*/}
    </>
  );
};

export default [
  {
    id: 'instanceTabModify',
    pluginPoint: 'cockpit.processInstance.diagram.plugin',
    render: (viewer: any) => {
      hooks.setViewer(viewer);
      viewer.get('eventBus').on('element.click', (event: any) => hooks.setClickedElementEvent(event));
      viewer.get('eventBus').on('element.hover', (event: any) => hooks.setElementEvent(event));
      hooks.setInstructions(initialState.instructions); // reset instructions when switching diagrams
    },
  },
  {
    id: 'instanceTabModifyTab',
    pluginPoint: 'cockpit.processInstance.runtime.tab',
    properties: {
      label: 'Modify',
    },
    render: (node: Element) => hooks.setTabNode(node),
  },
  {
    id: 'instanceTabModifyPlugin',
    pluginPoint: 'cockpit.processInstance.runtime.action',
    render: (node: Element, { api, processInstanceId }: InstancePluginParams) => {
      createRoot(node!).render(
        <React.StrictMode>
          <BatchModifyForm root={node} api={api} processInstanceId={processInstanceId} />
        </React.StrictMode>
      );

      hooks.setProcessInstanceId(processInstanceId); // ugly hack to handle version change
    },
  },
];
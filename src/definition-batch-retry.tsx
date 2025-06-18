import './bootstrap.scss';
import { createRoot } from 'react-dom/client';
import { API, DefinitionPluginParams } from './types';
import React, { useEffect } from 'react';
import { get } from './utils/api';
import BatchRetryConfirmationModal from './Components/BatchRetryConfirmationModal';

enum IncidentType {
  JOB = 'job',
  EXTERNAL_TASK = 'external-task',
}


export interface Incident {
  type: IncidentType;
  id: string;
}

const Plugin: React.FC<DefinitionPluginParams> = ({ api, processDefinitionId }) => {

  const [showInformationModal, setShowInformationModal] = React.useState(false);
  const [incidents, setIncidents] = React.useState<Incident[]>([]);

  useEffect(() => {
    (async() => {
      const jobs = await get(api, '/job', { noRetriesLeft: 'true', processDefinitionId });
      const newJobs: Incident[] = jobs.map((job: any) => ({
        type: IncidentType.JOB,
        id: job.id
      } as Incident));

      const externalTasks = await get(api, '/external-task', { noRetriesLeft: 'true', processDefinitionId });
      const newExternalTasks: Incident[] = externalTasks.map((externalTask: any) => ({
        type: IncidentType.EXTERNAL_TASK,
        id: externalTask.id
      } as Incident));

      setIncidents([
        ...newJobs,
        ...newExternalTasks
      ]);
    })();
  }, [processDefinitionId]);

  return (
    <>
      <button
        title="Batch Increment Number of Retries"
        className="btn btn-default action-button" style={{marginTop: '5px'}}
        disabled={incidents.length === 0}
        onClick={() => setShowInformationModal(true)}
      >
        <span className="glyphicon glyphicon-repeat"></span>
      </button>
      <BatchRetryConfirmationModal
        api={api}
        setShowModal={setShowInformationModal}
        showModal={showInformationModal}
        incidents={incidents}
        onExecuted={() => window.location.reload()}
      />
    </>
  );
};

export default [
  {
    id: 'batchRetryButton',
    pluginPoint: 'cockpit.processDefinition.runtime.action',
    properties: {
      label: 'Retry',
    },
    render: (node: Element, { api, processDefinitionId }: DefinitionPluginParams) => {
      createRoot(node!).render(
        <React.StrictMode>
          <Plugin root={node} api={api} processDefinitionId={processDefinitionId} />
        </React.StrictMode>
      );
    },
  },
];

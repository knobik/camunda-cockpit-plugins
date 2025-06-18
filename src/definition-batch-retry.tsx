import './bootstrap.scss';
import { createRoot } from 'react-dom/client';
import { DefinitionPluginParams } from './types';
import React, { useEffect } from 'react';
import { get } from './utils/api';
import BatchRetryConfirmationModal from './Components/BatchRetryConfirmationModal';

const Plugin: React.FC<DefinitionPluginParams> = ({ api, processDefinitionId }) => {

  const [showInformationModal, setShowInformationModal] = React.useState(false);
  const [jobs, setJobs] = React.useState<any[]>([]);

  useEffect(() => {
    (async() => {
      const data = await get(api, '/job', { noRetriesLeft: 'true', processDefinitionId });
      setJobs(data);
    })();
  }, [processDefinitionId]);

  return (
    <>
      <button
        title="Batch Increment Number of Retries"
        className="btn btn-default action-button" style={{marginTop: '5px'}}
        disabled={jobs.length === 0}
        onClick={() => setShowInformationModal(true)}
      >
        <span className="glyphicon glyphicon-repeat"></span>
      </button>
      <BatchRetryConfirmationModal
        api={api}
        setShowModal={setShowInformationModal}
        showModal={showInformationModal}
        jobs={jobs}
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

import React, { useMemo, useState } from 'react';
import ReactModal from 'react-modal';
import { post, put } from '../utils/api';
import { API } from '../types';
import { Incident } from '../definition-batch-retry';

export interface Props {
  setShowModal: (showModal: boolean) => void;
  showModal: boolean;
  incidents: Incident[]
  api: API,
  onExecuted: () => void;
}

const BatchRetryConfirmationModal: React.FC<Props> = ({ setShowModal, showModal, incidents, api, onExecuted }) => {

  const [showLoading, setShowLoading] = useState(false);
  const [retriedCount, setRetriedCount] = useState(0);

  function executeRetry() {
    (async () => {
      setShowLoading(true);

      let count = 0;
      // foreach job, increment the number of retries
      for (const incident of incidents) {
        await put(api, `/${incident.type as string}/${incident.id}/retries`, {}, JSON.stringify({ retries: 1 }));
        count++;
        setRetriedCount(count);
      }

      setShowLoading(false);
      setShowModal(false);
      onExecuted();
    })();
  }

  return (
    <ReactModal
      className="modal-dialog batch-retry-modal"
      isOpen={showModal}
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
          <h3>Batch Increment Number of Retries</h3>
        </div>
        <div className="modal-body">
          <div className="row">
            <div className="col-md-12">
              <p>
                The number of retries of all failed jobs and external-tasks associated with the selected process definition will be incremented.
              </p>
              <p>
                Are you sure you want to increment the number of retries? This will effectively retry all incidents.
              </p>
            </div>
          </div>
        </div>
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
          <button className="btn btn-default" onClick={() => setShowModal(false)}>
            Cancel
          </button>
          <button
            className="btn btn-danger"
            style={{ marginLeft: '1em' }}
            disabled={showLoading}
            onClick={executeRetry}
          >
            Retry ({showLoading && (
              <>
                {retriedCount}/
              </>
            )}{incidents.length}) {showLoading && <span className="loader" style={{ marginLeft: '0.7em' }}></span>}
          </button>
        </div>
      </div>
    </ReactModal>
  );
};

export default BatchRetryConfirmationModal;

import React, { useMemo, useState } from 'react';
import ReactModal from 'react-modal';
import { post, put } from '../utils/api';
import { API } from '../types';

export interface Props {
  setShowModal: (showModal: boolean) => void;
  showModal: boolean;
  jobs: any[]
  api: API,
  onExecuted: () => void;
}

const BatchRetryConfirmationModal: React.FC<Props> = ({ setShowModal, showModal, jobs, api, onExecuted }) => {

  const [showLoading, setShowLoading] = useState(false);

  function executeRetry() {
    (async () => {
      setShowLoading(true);

      // foreach job, increment the number of retries
      for (const job of jobs) {
        await put(api, `/job/${job.id}/retries`, {}, JSON.stringify({ retries: 1 }));
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
                The number of retries of all failed jobs associated with the selected process definition will be incremented.
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
            Retry ({jobs.length}) {showLoading && <span className="loader" style={{ marginLeft: '0.7em' }}></span>}
          </button>
        </div>
      </div>
    </ReactModal>
  );
};

export default BatchRetryConfirmationModal;

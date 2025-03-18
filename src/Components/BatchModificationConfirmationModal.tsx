import './batch-modification-confirmation-modal.scss';

import React, { useEffect, useState } from 'react';
import { ReactJason } from 'react-jason';
import github from 'react-jason/themes/github';
import ReactModal from 'react-modal';

import { API } from '../types';
import { post } from '../utils/api';
import { ModificationInstruction } from './ModificationTable';
import { FilterType } from './ProcessInstanceSelectModal';

export interface BatchModificationConfirmationModalProps {
  api: API;
  processDefinitionId: string;
  instructions: ModificationInstruction[];
  filterType: FilterType;
  selectedProcessInstances: string[];
  selectedQuery: Record<string, any>;
  showModal: boolean;
  setShowModal: (showModal: boolean) => void;
  onBack: () => void;
  onExecuted: (asynchronous: boolean, response: any) => void;
}

const BatchModificationConfirmationModal: React.FC<BatchModificationConfirmationModalProps> = ({
  api,
  processDefinitionId,
  instructions,
  filterType,
  selectedProcessInstances,
  selectedQuery,
  showModal,
  setShowModal,
  onBack,
  onExecuted,
}) => {
  const [asynchronous, setAsynchronous] = useState(true);
  const [onlyCancelCurrent, setOnlyCancelCurrent] = useState(true);
  const [skipCustomListeners, setSkipCustomListeners] = useState(true);
  const [skipIoMappings, setSkipIoMappings] = useState(true);
  const [annotation, setAnnotation] = useState('');
  const [showRequestPayload, setShowRequestPayload] = useState(false);
  const [payload, setPayload] = useState({} as Record<string, any>);
  const [instanceCount, setInstanceCount] = useState(0);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    const newPayload = {
      processDefinitionId,
      processInstanceIds: filterType === FilterType.INSTANCE ? selectedProcessInstances : undefined,
      processInstanceQuery:
        filterType === FilterType.QUERY
          ? {
              processDefinitionId: processDefinitionId,
              ...selectedQuery,
            }
          : undefined,
      skipCustomListeners,
      skipIoMappings,
      annotation: annotation === '' ? undefined : annotation,
      instructions: instructions.map(instruction => ({
        type: instruction.type,
        activityId: instruction.activityId,
        cancelCurrentActiveActivityInstances: instruction.type === 'cancel' ? onlyCancelCurrent : undefined,
      })),
    };

    setPayload(newPayload);
  }, [
    processDefinitionId,
    filterType,
    selectedProcessInstances,
    selectedQuery,
    onlyCancelCurrent,
    skipCustomListeners,
    skipIoMappings,
    annotation,
  ]);

  useEffect(() => {
    (async () => {
      if (filterType === FilterType.QUERY) {
        const response = await post(
          api,
          '/process-instance/count',
          {},
          JSON.stringify({
            processDefinitionId,
            ...selectedQuery,
          })
        );

        setInstanceCount(response.count);
      } else {
        setInstanceCount(selectedProcessInstances.length);
      }
    })();
  }, [processDefinitionId, filterType, selectedProcessInstances, selectedQuery]);

  function executeModification() {
    (async () => {
      setShowLoading(true);

      let url = '/modification/execute';
      if (asynchronous) {
        url = '/modification/executeAsync';
      }

      const response = await post(api, url, {}, JSON.stringify(payload));

      setShowLoading(false);
      setShowModal(false);
      onExecuted(asynchronous, response);
    })();
  }

  return (
    <ReactModal
      className="modal-dialog confirmation-modal"
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
          <h3>Confirm modification</h3>
        </div>
        <div className="modal-body">
          <div className="row">
            <div className="col-md-12">
              <div style={{ textAlign: 'center' }}>
                You are playing with <span className="glyphicon glyphicon-fire"></span>. Please, carefully review the modification being performed.
              </div>
              <h3>Options</h3>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <div className="checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={asynchronous}
                          onChange={event => setAsynchronous(event.target.checked)}
                        />
                        <strong>Asynchronous</strong>
                      </label>
                    </div>
                    <span className="help-block">
                      It is recommended to keep this checked if there is a significant amount of instances to modify.
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <div className="checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={onlyCancelCurrent}
                          onChange={event => setOnlyCancelCurrent(event.target.checked)}
                        />
                        <strong>Only Cancel Currently Active Activity Instances</strong>
                      </label>
                    </div>
                    <span className="help-block">
                      Can only be used with cancel instructions. It prevents the deletion of all new created activity
                      instances.
                    </span>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <div className="checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={skipCustomListeners}
                          onChange={event => setSkipCustomListeners(event.target.checked)}
                        />
                        <strong>Skip Custom Listeners</strong>
                      </label>
                    </div>
                    <span className="help-block">
                      Skip execution listener invocation for activities that are started or ended as part of this
                      request.
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <div className="checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={skipIoMappings}
                          onChange={event => setSkipIoMappings(event.target.checked)}
                        />
                        <strong>Skip IO Mappings</strong>
                      </label>
                    </div>
                    <span className="help-block">
                      Skip execution of input/output variable mappings for activities that are started or ended as part
                      of this request.
                    </span>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Annotation</label>
                    <textarea
                      className="form-control"
                      placeholder="Why would you do that?"
                      value={annotation}
                      onChange={event => setAnnotation(event.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6"></div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <h3>Summary</h3>
              <p>
                You are about to modify <strong>{instanceCount}</strong> instances in the following way:
              </p>
              <table className="cam-table">
                <tbody>
                  {instructions.map((instruction, index) => (
                    <tr key={index} className={instruction.type === 'cancel' ? 'color-cancel' : 'color-move'}>
                      <td className="empty"></td>
                      <td style={{ paddingLeft: '1em' }}>{instruction.type}</td>
                      <td>{instruction.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="row">
            <div className="col-md-2">
              <button className="btn btn-default" onClick={() => setShowRequestPayload(!showRequestPayload)}>
                <span
                  className={`glyphicon ${showRequestPayload ? 'glyphicon-eye-close' : 'glyphicon-eye-open'}`}
                ></span>
              </button>
            </div>
            {showRequestPayload && (
              <div className="col-md-10">
                <p>requestPayload</p>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <ReactJason value={payload} theme={github} />
                </div>
              </div>
            )}
          </div>
        </div>
        <div
          className="model-footer"
          style={{
            height: '4em',
            paddingRight: '1em',
            paddingLeft: '1em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <button className="btn btn-default" onClick={onBack}>
              Back
            </button>
          </div>
          <div>
            <button className="btn btn-link" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              style={{ marginLeft: '1em' }}
              disabled={instanceCount === 0 || showLoading}
              onClick={executeModification}
            >
              Execute modification
            </button>
          </div>
        </div>
      </div>
    </ReactModal>
  );
};

export default BatchModificationConfirmationModal;

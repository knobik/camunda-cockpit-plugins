import React, { useEffect, useState } from 'react';
import ReactModal from 'react-modal';

export interface BatchInformationModalProps {
  setShowModal: (showModal: boolean) => void;
  showModal: boolean;
  content: string;
  response: any;
}

const BatchInformationModal: React.FC<BatchInformationModalProps> = ({ setShowModal, showModal, response, content }) => {
  function gotoBatch(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
    e.preventDefault();
    setShowModal(false);

    window.location.href = `#/batch?searchQuery=%5B%5D&details=${response.id}&type=runtime`;
  }

  return (
    <ReactModal
      className="modal-dialog process-select-modal"
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
          <h3>Batch modification</h3>
        </div>
        <div className="modal-body">
          <div className="row">
            <div className="col-md-12" style={{ textAlign: 'center' }}>
              <h2>
                <span className="glyphicon glyphicon-ok"></span>
              </h2>
              <h3>{content}</h3>
              <h3>
                <a href="#" onClick={e => gotoBatch(e)}>
                  Observe progress
                </a>
              </h3>
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
            Close
          </button>
        </div>
      </div>
    </ReactModal>
  );
};

export default BatchInformationModal;

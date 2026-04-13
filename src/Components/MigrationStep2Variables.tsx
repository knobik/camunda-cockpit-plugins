import React, { useState } from 'react';
import ReactModal from 'react-modal';

import { API, VariableValueDto } from '../types';
import { MigrationState } from './MigrationWizard';

interface Props {
  api: API;
  state: MigrationState;
  updateState: (partial: Partial<MigrationState>) => void;
}

const VARIABLE_TYPES = [
  'String',
  'Integer',
  'Long',
  'Short',
  'Double',
  'Boolean',
  'Date',
  'Object',
  'File',
  'Bytes',
  'Null',
];

const MigrationStep2Variables: React.FC<Props> = ({ api, state, updateState }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [modalName, setModalName] = useState('');
  const [modalType, setModalType] = useState('String');
  const [modalValue, setModalValue] = useState('');

  const openAddModal = () => {
    setModalName('');
    setModalType('String');
    setModalValue('');
    setEditingName(null);
    setShowAddModal(true);
  };

  const openEditModal = (name: string) => {
    const v = state.variables[name];
    setModalName(name);
    setModalType(v.type);
    setModalValue(v.value != null ? String(v.value) : '');
    setEditingName(name);
    setShowAddModal(true);
  };

  const handleAdd = () => {
    if (!modalName.trim()) return;
    const newVars = { ...state.variables };
    if (editingName && editingName !== modalName) {
      delete newVars[editingName];
    }
    newVars[modalName] = {
      type: modalType,
      value: modalType === 'Null' ? null : modalValue,
    };
    updateState({ variables: newVars });
    setShowAddModal(false);
  };

  const handleDelete = (name: string) => {
    const newVars = { ...state.variables };
    delete newVars[name];
    updateState({ variables: newVars });
  };

  const variableEntries = Object.entries(state.variables);
  const varReports = state.validationReport?.variableReports || {};

  return (
    <div className="migration-variables">
      <p>Add variables that will be set into the process instances' scope.</p>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <button className="btn btn-danger" onClick={openAddModal}>
          Add Variable
        </button>
      </div>

      {variableEntries.length > 0 && (
        <table className="cam-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Value</th>
              <th>Valid</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {variableEntries.map(([name, variable]) => {
              const report = varReports[name];
              const hasFailures = report && report.failures && report.failures.length > 0;
              return (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{variable.type}</td>
                  <td>{variable.value != null ? String(variable.value) : '<null>'}</td>
                  <td>
                    {hasFailures ? (
                      <span
                        className="migration-badge error"
                        title={report!.failures.join('\n')}
                        style={{ cursor: 'help' }}
                      >
                        &#x2716;
                      </span>
                    ) : (
                      <span className="migration-badge success">&#x2714;</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-xs btn-default"
                      onClick={() => openEditModal(name)}
                      style={{ marginRight: '5px' }}
                    >
                      <span className="glyphicon glyphicon-pencil" />
                    </button>
                    <button className="btn btn-xs btn-danger" onClick={() => handleDelete(name)}>
                      <span className="glyphicon glyphicon-trash" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <ReactModal
        className="modal-dialog"
        isOpen={showAddModal}
        style={{ content: {}, overlay: { zIndex: 2000 } }}
        ariaHideApp={false}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h3>{editingName ? 'Edit Variable' : 'Add Variable to Migration Plan'}</h3>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>Variable Name*</label>
              <input
                type="text"
                className="form-control"
                value={modalName}
                onChange={e => setModalName(e.target.value)}
                disabled={!!editingName}
              />
            </div>
            <div className="form-group">
              <label>Variable Type*</label>
              <select className="form-control" value={modalType} onChange={e => setModalType(e.target.value)}>
                {VARIABLE_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            {modalType !== 'Null' && (
              <div className="form-group">
                <label>Variable Value*</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={modalValue}
                  onChange={e => setModalValue(e.target.value)}
                />
              </div>
            )}
          </div>
          <div
            className="modal-footer"
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '15px' }}
          >
            <button className="btn btn-link" onClick={() => setShowAddModal(false)}>
              Close
            </button>
            <button className="btn btn-danger" onClick={handleAdd} disabled={!modalName.trim()}>
              {editingName ? 'Save' : 'Add'}
            </button>
          </div>
        </div>
      </ReactModal>
    </div>
  );
};

export default MigrationStep2Variables;

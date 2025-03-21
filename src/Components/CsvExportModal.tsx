import React, { useMemo, useState } from 'react';
import ReactModal from 'react-modal';

import { API } from '../types';
import { post } from '../utils/api';
import { mkConfig, generateCsv, download } from "export-to-csv";

enum ResultSet {
  SELECTED = 'selected',
  PAGE = 'page',
  ALL = 'all',
}

export interface Props {
  api: API;
  setShowModal: (showModal: boolean) => void;
  showModal: boolean;
  instances: any[];
  selectedInstances: string[];
  perPage: number;
  total: number;
  query: any;
  processDefinitionId: string;
}

const CsvExportModal: React.FC<Props> = ({
  setShowModal,
  showModal,
  instances,
  selectedInstances,
  perPage,
  total,
  query,
  api,
  processDefinitionId,
}) => {
  const [variables, setVariables] = useState([] as string[]);
  const [resultSet, setResultSet] = useState(ResultSet.SELECTED);
  const [exporting, setExporting] = useState(false);

  const pageCount = useMemo(() => {
    return Math.ceil(total / perPage);
  }, [total, perPage]);

  function exportCsv() {
    (async () => {
      setExporting(true);
      let fetchedInstances = [] as any[];

      if (resultSet === ResultSet.SELECTED) {
        fetchedInstances = await post(
          api,
          '/history/process-instance',
          {},
          JSON.stringify({
            processInstanceIds: selectedInstances,
          })
        );
      }

      if (resultSet === ResultSet.PAGE) {
        fetchedInstances = instances;
      }

      if (resultSet === ResultSet.ALL) {
        for (let i = 0; i < pageCount; i++) {
          const part = await post(
            api,
            '/history/process-instance',
            {
              firstResult: (i * perPage).toString(),
              maxResults: perPage.toString(),
            },
            JSON.stringify({processDefinitionId, ...query})
          );
          fetchedInstances.push(...part);
        }
      }

      let variableList = [] as any[];
      if (variables.length > 0) {
        variableList = await post(
          api,
          '/history/variable-instance',
          {
            deserializeValues: 'true',
          },
          JSON.stringify({
            processInstanceIdIn: fetchedInstances.map(i => i.id),
            variableNameIn: variables,
          })
        );

        variableList.map(variable => {
          const instance = fetchedInstances.find(i => i.id === variable.processInstanceId);
          if (instance) {
            instance[variable.name] = variable.value;
          }
        });
      }

      const csvConfig = mkConfig({ useKeysAsHeaders: true, filename: 'exported' });
      const csv = generateCsv(csvConfig)(fetchedInstances);
      download(csvConfig)(csv);

      setExporting(false);
      setShowModal(false);
    })();
  }

  function addVariable() {
    setVariables([...variables, '']);
  }

  function changeVariable(index: number, value: string) {
    const newVariables = [...variables];
    newVariables[index] = value;
    setVariables(newVariables);
  }

  function removeVariable(index: number) {
    const newVariables = [...variables];
    newVariables.splice(index, 1);
    setVariables(newVariables);
  }

  function changeResultSet(value: ResultSet) {
    setResultSet(value);
  }

  return (
    <ReactModal
      className="modal-dialog csv-export-modal"
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
          <h3>Export process instances</h3>
        </div>
        <div className="modal-body">
          <div className="row">
            <div className="col-md-12">
              <p>
                You are about to export a list of process instances as a CSV file. You can configure the export result
                below.
              </p>
              <h3>Result Set</h3>
              <p>Process instances to be exported:</p>
              <div className="form-horizontal">
                  <div className="form-group">
                    <label htmlFor="resultSet-selected" className="col-sm-5 control-label">
                      Selected instances ({selectedInstances.length})
                    </label>
                    <div className="col-sm-5">
                      <div className="radio">
                        <label>
                          <input
                            id="resultSet-selected"
                            type="radio"
                            name="resultSet"
                            value={ResultSet.SELECTED}
                            checked={resultSet === ResultSet.SELECTED}
                            onChange={() => changeResultSet(ResultSet.SELECTED)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                <div className="form-group">
                  <label htmlFor="resultSet-page" className="col-sm-5 control-label">
                    Current page
                  </label>
                  <div className="col-sm-5">
                    <div className="radio">
                      <label>
                        <input
                          id="resultSet-page"
                          type="radio"
                          name="resultSet"
                          value={ResultSet.PAGE}
                          checked={resultSet === ResultSet.PAGE}
                          onChange={() => changeResultSet(ResultSet.PAGE)}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="resultSet-all" className="col-sm-5 control-label">
                    All {pageCount} pages
                  </label>
                  <div className="col-sm-5">
                    <div className="radio">
                      <label>
                        <input
                          id="resultSet-all"
                          type="radio"
                          name="resultSet"
                          value={ResultSet.ALL}
                          checked={resultSet === ResultSet.ALL}
                          onChange={() => changeResultSet(ResultSet.ALL)}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <h3>Process variables</h3>
              <p>Define process variables that you want to attach to each process instance:</p>
              <div className="form-horizontal">
                <div className="form-group">
                  <label className="col-sm-2" style={{ textAlign: 'right' }}>
                    <button className="btn btn-default" onClick={addVariable}>
                      <span className="glyphicon glyphicon-plus"></span>
                    </button>
                  </label>
                  <div className="col-sm-10" style={{ marginTop: '7px' }}>
                    <strong>Variable name</strong>
                  </div>
                </div>
                {variables.map((variable, index) => (
                  <div className="form-group" key={index}>
                    <label className="col-sm-2" style={{ textAlign: 'right' }}>
                      <button className="btn btn-danger" onClick={event => removeVariable(index)}>
                        <span className="glyphicon glyphicon-trash"></span>
                      </button>
                    </label>
                    <div className="col-sm-10">
                      <input
                        type="text"
                        className="form-control"
                        value={variable}
                        onChange={event => changeVariable(index, event.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                ))}
              </div>
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
          <button className="btn btn-link" onClick={() => setShowModal(false)}>
            Close
          </button>
          <button className="btn btn-danger" style={{ marginLeft: '1em' }} onClick={exportCsv} disabled={exporting || (resultSet === ResultSet.SELECTED && selectedInstances.length === 0)}>
            Export CSV {exporting && <span className="loader" style={{ marginLeft: '0.7em' }}></span>}
          </button>
        </div>
      </div>
    </ReactModal>
  );
};

export default CsvExportModal;

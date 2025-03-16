import React, { useEffect, useState } from 'react';
import ReactModal from 'react-modal';

import { API } from '../types';
import { get } from '../utils/api';
import CamundaFilterBox, { ExpressionDefinition, Operator } from './CamundaFilterBox';

export interface FilteredProcessInstance {
  id: string;
  businessKey: string;
  checked: boolean;
}

export interface ProcessInstanceSelectModalProps {
  api: API;
  setShowInstanceModal: any;
  showInstanceModal: boolean;
  processDefinitionId: string;
}

const expressionDefinitions: ExpressionDefinition[] = [
  {
    label: 'Business Key',
    type: 'businessKey',
    availableOperators: [Operator.eq],
    defaultOperator: Operator.eq,
    requiresValue: true,
    requiresName: false,
  } as ExpressionDefinition,
  {
    label: 'Activity ID',
    type: 'activityIdIn',
    availableOperators: [Operator.eq],
    defaultOperator: Operator.eq,
    requiresValue: true,
    requiresName: false,
  } as ExpressionDefinition,
  {
    label: 'With Incidents',
    type: 'withIncidents',
    availableOperators: [Operator.eq],
    defaultOperator: Operator.eq,
    requiresValue: false,
    requiresName: false,
  } as ExpressionDefinition,
  {
    label: 'Variable',
    type: 'variable',
    availableOperators: [
      Operator.eq,
      Operator.neq,
      Operator.gt,
      Operator.gteq,
      Operator.lt,
      Operator.lteq,
      Operator.like,
    ],
    defaultOperator: Operator.eq,
    requiresValue: true,
    requiresName: true,
  } as ExpressionDefinition,
];

const ProcessInstanceSelectModal: React.FC<ProcessInstanceSelectModalProps> = ({
  setShowInstanceModal,
  showInstanceModal,
  api,
  processDefinitionId,
}) => {
  const [query, setQuery] = useState({} as Record<string, any>);
  const [expressions, setExpressions] = useState([] as ExpressionDefinition[]);
  const [processInstances, setProcessInstances] = useState([] as FilteredProcessInstance[]);
  const [filterType, setFilterType] = useState('instance');

  useEffect(() => {
    if (Object.keys(query).length > 0) {
      (async () => {
        const items = await get(api, '/process-instance', {
          ...query,
          processDefinitionId,
        });

        const filtered: FilteredProcessInstance[] = items.map((item: any) => {
          return {
            id: item.id,
            businessKey: item.businessKey,
            checked: filterType === 'query',
          } as FilteredProcessInstance;
        });

        setProcessInstances(filtered);
      })();
    }
  }, [query]);

  useEffect(() => {
    if (expressions.length > 0) {
      // const query: any = {
      //   sortBy: 'endTime',
      //   sortOrder: 'desc',
      //   maxResults: 1000,
      // };
      // for (const { category, operator, value } of expressions) {
      //   if (category === 'started' && operator === 'after' && !isNaN(new Date(`${value}`).getTime())) {
      //     query['startedAfter'] = `${value}T00:00:00.000+0000`;
      //   } else if (category === 'finished' && operator === 'before' && !isNaN(new Date(`${value}`).getTime())) {
      //     query['finishedBefore'] = `${value}T00:00:00.000+0000`;
      //   } else if (category === 'maxResults' && operator == 'is' && !isNaN(parseInt(`${value}`, 10))) {
      //     query['maxResults'] = `${value}`;
      //   }
      // }
      // setQuery(query);
    } else {
      setQuery({
        firstResult: 0,
        // sortBy: 'definitionKey',
        // sortOrder: 'asc',
      });
    }
  }, [expressions]);

  function toggleChecked(id: string) {
    processInstances.map((processInstance: FilteredProcessInstance) => {
      if (processInstance.id === id) {
        processInstance.checked = !processInstance.checked;
      }
    });

    setProcessInstances([...processInstances]);
  }

  function toggleCheckedAll(checked: boolean) {
    processInstances.map((processInstance: FilteredProcessInstance) => {
      processInstance.checked = checked;
    });

    setProcessInstances([...processInstances]);
  }

  function changeFilterType(value: string) {
    if (value === 'query') {
      toggleCheckedAll(true);
    }

    setFilterType(value);
  }

  return (
    <ReactModal
      className="modal-dialog process-select-modal"
      isOpen={showInstanceModal}
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
          <h3>Select instances to modify</h3>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: '2em' }}>
            <h4>Choose selection type</h4>
            <div>
              <label className="radio-inline">
                <input
                  type="radio"
                  name="filterType"
                  value="instance"
                  defaultChecked={filterType === 'instance'}
                  onChange={event => changeFilterType(event.target.value)}
                />
                <strong>Instance</strong>
              </label>
              <label className="radio-inline">
                <input
                  type="radio"
                  name="filterType"
                  value="query"
                  defaultChecked={filterType === 'query'}
                  onChange={event => changeFilterType(event.target.value)}
                />
                <strong>Query</strong>
              </label>
            </div>
          </div>
          <div>
            <h4>Filter for running process instances</h4>
            <CamundaFilterBox
              availableExpressions={expressionDefinitions}
              placeholder="Filter available instances..."
            />
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="cam-table">
                <thead>
                  <tr>
                    {filterType === 'instance' &&
                      <th>
                        <input
                          type="checkbox"
                          checked={processInstances.every(
                            (processInstance: FilteredProcessInstance) => processInstance.checked
                          )}
                          onChange={event => toggleCheckedAll(event.target.checked)}
                        />
                      </th>
                    }
                    <th>ID</th>
                    <th>Business Key</th>
                  </tr>
                </thead>
                <tbody>
                  {processInstances.map((processInstance: any, index: number) => (
                    <tr key={index}>
                      {filterType === 'instance' &&
                        <td>
                          <input
                            type="checkbox"
                            checked={processInstance.checked}
                            onChange={() => toggleChecked(processInstance.id)}
                          />
                        </td>
                      }
                      <td>
                        <a href={`#/process-instance/${processInstance.id}`} target="_blank">
                          {processInstance.id}
                        </a>
                      </td>
                      <td>{processInstance.businessKey}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          <button className="btn btn-default" onClick={() => setShowInstanceModal(false)}>
            Close
          </button>
          <button className="btn btn-danger" style={{ marginLeft: '1em' }} disabled={!processInstances.some((instance: FilteredProcessInstance) => instance.checked)}>
            Modify selected instances ({processInstances.filter((instance: FilteredProcessInstance) => instance.checked).length})
          </button>
        </div>
      </div>
    </ReactModal>
  );
};

export default ProcessInstanceSelectModal;

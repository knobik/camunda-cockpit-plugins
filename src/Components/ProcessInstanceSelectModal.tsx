import React, { useEffect, useState } from 'react';
import ReactModal from 'react-modal';

import { API } from '../types';
import { post } from '../utils/api';
import CamundaFilterBox, {
  Expression,
  ExpressionDefinition,
  Operator,
  isValidExpression, castValue,
} from './FilterBox/CamundaFilterBox';

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
    type: 'withIncident',
    availableOperators: [Operator.eq],
    defaultOperator: Operator.eq,
    defaultValue: 'true',
    requiresValue: false,
    requiresName: false,
  } as ExpressionDefinition,
  {
    label: 'Without Incidents',
    type: 'withIncident',
    availableOperators: [Operator.eq],
    defaultOperator: Operator.eq,
    defaultValue: 'false',
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

export enum FilterType {
  INSTANCE = 'instance',
  QUERY = 'query',
}

export interface FilteredProcessInstance {
  id: string;
  businessKey: string;
  checked: boolean;
}

export interface ProcessInstanceSelectModalProps {
  api: API;
  setShowModal: (showModal: boolean) => void;
  showModal: boolean;
  processDefinitionId: string;
  onCompleted: (queryType: FilterType, processInstanceIds?: string[], query?: Record<string, any>) => void;
}

const ProcessInstanceSelectModal: React.FC<ProcessInstanceSelectModalProps> = ({
  setShowModal,
  showModal,
  api,
  processDefinitionId,
  onCompleted,
}) => {
  const [query, setQuery] = useState({} as Record<string, any>);
  const [expressions, setExpressions] = useState([] as Expression[]);
  const [processInstances, setProcessInstances] = useState([] as FilteredProcessInstance[]);
  const [filterType, setFilterType] = useState(FilterType.INSTANCE);

  useEffect(() => {
    (async () => {
      const items = await post(
        api,
        '/process-instance',
        {},
        JSON.stringify({
          ...query,
          processDefinitionId,
        })
      );

      const filtered: FilteredProcessInstance[] = items.map((item: any) => {
        return {
          id: item.id,
          businessKey: item.businessKey,
          checked: filterType === 'query',
        } as FilteredProcessInstance;
      });

      setProcessInstances(filtered);
    })();
  }, [query, processDefinitionId]);

  useEffect(() => {
    const validExpressions: Expression[] = expressions.filter(expression => isValidExpression(expression));

    const variableExpressions: any[] = validExpressions
      .filter((expression: Expression) => expression.definition.type === 'variable')
      .map((expression: Expression) => {
        return {
          name: expression.name,
          operator: expression.operator as string,
          value: castValue(expression.value),
        };
      });

    const activityIdInExpressions: string[] = validExpressions
      .filter((expression: Expression) => expression.definition.type === 'activityIdIn')
      .map((expression: Expression) => {
        return expression.value;
      });

    const rest = validExpressions.filter(
      (expression: Expression) =>
        expression.definition.type !== 'variable' && expression.definition.type !== 'activityIdIn'
    );

    let newQuery: any = {};
    rest.map((expression: Expression) => {
      newQuery[expression.definition.type] = castValue(expression.value);
    });

    if (activityIdInExpressions.length > 0) {
      newQuery['activityIdIn'] = activityIdInExpressions;
    }
    if (variableExpressions.length > 0) {
      newQuery['variables'] = variableExpressions;
    }

    if (JSON.stringify(newQuery) !== JSON.stringify(query)) {
      setQuery(newQuery);
    }
  }, [expressions, processDefinitionId]);

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

  function changeFilterType(value: FilterType) {
    if (value === FilterType.QUERY) {
      toggleCheckedAll(true);
    }

    setFilterType(value);
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
          <h3>Select instances to modify</h3>
        </div>
        <div className="modal-body">
          <div className="row">
            <div className="col-md-12">
              <h4>Choose selection type</h4>
              <div>
                <label className="radio-inline">
                  <input
                    type="radio"
                    name="filterType"
                    value={FilterType.INSTANCE}
                    checked={filterType === FilterType.INSTANCE}
                    onChange={() => changeFilterType(FilterType.INSTANCE)}
                  />
                  <strong>Instance</strong>
                </label>
                <label className="radio-inline">
                  <input
                    type="radio"
                    name="filterType"
                    value={FilterType.QUERY}
                    checked={filterType === FilterType.QUERY}
                    onChange={() => changeFilterType(FilterType.QUERY)}
                  />
                  <strong>Query</strong>
                </label>
              </div>
            </div>
          </div>
          <div className="row" style={{ marginTop: '1em'}}>
            <div className="col-md-12">
              <h4>Filter for running process instances</h4>
              <CamundaFilterBox
                expressions={expressions}
                setExpressions={setExpressions}
                availableExpressions={expressionDefinitions}
                placeholder="Filter available instances..."
              >
                <span title="Process Instance Count">{processInstances.length}</span>
              </CamundaFilterBox>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="cam-table">
                  <thead>
                    <tr>
                      {filterType === 'instance' && (
                        <th>
                          <input
                            type="checkbox"
                            checked={processInstances.every(
                              (processInstance: FilteredProcessInstance) => processInstance.checked
                            )}
                            onChange={event => toggleCheckedAll(event.target.checked)}
                          />
                        </th>
                      )}
                      <th>ID</th>
                      <th>Business Key</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processInstances.map((processInstance: any, index: number) => (
                      <tr key={index}>
                        {filterType === FilterType.INSTANCE && (
                          <td>
                            <input
                              type="checkbox"
                              checked={processInstance.checked}
                              onChange={() => toggleChecked(processInstance.id)}
                            />
                          </td>
                        )}
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
            Cancel
          </button>
          <button
            className="btn btn-danger"
            style={{ marginLeft: '1em' }}
            disabled={!processInstances.some((instance: FilteredProcessInstance) => instance.checked)}
            onClick={() => {
              onCompleted(
                filterType,
                filterType === FilterType.INSTANCE
                  ? processInstances
                      .filter((instance: FilteredProcessInstance) => instance.checked)
                      .map((instance: FilteredProcessInstance) => instance.id)
                  : undefined,
                filterType === FilterType.QUERY ? query : undefined
              );
              setShowModal(false);
            }}
          >
            Modify selected instances (
            {processInstances.filter((instance: FilteredProcessInstance) => instance.checked).length})
          </button>
        </div>
      </div>
    </ReactModal>
  );
};

export default ProcessInstanceSelectModal;

import 'allotment/dist/style.css';

import './instance-route-history.scss';

import { Allotment } from 'allotment';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';

import AuditLogTable from './Components/AuditLogTable';
import BPMN from './Components/BPMN';
import BreadcrumbsPanel from './Components/BreadcrumbsPanel';
import { Clippy } from './Components/Clippy';
import Container from './Components/Container';
import CamundaFilterBox, {
  Expression,
  ExpressionDefinition,
  Operator,
  castValue,
  isValidExpression,
} from './Components/FilterBox/CamundaFilterBox';
import HistoryTable from './Components/HistoryTable';
import Page from './Components/Page';
import Pagination from './Components/Pagination';
import Portal from './Components/Portal';
import { ToggleHistoryViewButton } from './Components/ToggleHistoryViewButton';
import VariablesTable from './Components/VariablesTable';
import { DefinitionPluginParams, RoutePluginParams } from './types';
import { get, post } from './utils/api';
import { loadSettings, saveSettings } from './utils/misc';

const availableExpressions: ExpressionDefinition[] = [
  {
    label: 'Business Key',
    type: 'processInstanceBusinessKey',
    availableOperators: [Operator.eq],
    defaultOperator: Operator.eq,
    requiresValue: true,
    requiresName: false,
  } as ExpressionDefinition,
  {
    label: 'Executed Activity ID',
    type: 'executedActivityIdIn',
    availableOperators: [Operator.eq],
    defaultOperator: Operator.eq,
    requiresValue: true,
    requiresName: false,
  } as ExpressionDefinition,
  {
    label: 'Start Date',
    type: 'startedDate',
    availableOperators: [Operator.before, Operator.after],
    defaultOperator: Operator.before,
    requiresValue: true,
    requiresName: false,
    fieldType: 'datetime',
  } as ExpressionDefinition,
  {
    label: 'Finished Date',
    type: 'finishedDate',
    availableOperators: [Operator.before, Operator.after],
    defaultOperator: Operator.before,
    requiresValue: true,
    requiresName: false,
    fieldType: 'datetime',
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
  {
    label: 'Finished',
    type: 'finished',
    availableOperators: [Operator.eq],
    defaultOperator: Operator.eq,
    defaultValue: 'true',
    requiresValue: false,
    requiresName: false,
  } as ExpressionDefinition,
  {
    label: 'Unfinished',
    type: 'unfinished',
    availableOperators: [Operator.eq],
    defaultOperator: Operator.eq,
    defaultValue: 'true',
    requiresValue: false,
    requiresName: false,
  } as ExpressionDefinition,
];

const initialState: Record<string, any> = {
  historyTabNode: null,
};

const hooks: Record<string, any> = {
  setHistoryTabNode: (node: Element) => (initialState.historyTabNode = node),
};

const Plugin: React.FC<DefinitionPluginParams> = ({ root, api, processDefinitionId }) => {
  const [expressions, setExpressions] = useState([] as Expression[]);
  const [query, setQuery] = useState({} as Record<string, string | number | null>);
  const [historyTabNode, setHistoryTabNode] = useState(initialState.historyTabNode);

  hooks.setHistoryTabNode = setHistoryTabNode;

  const [instances, setInstances]: any = useState([] as any[]);
  const [instancesCount, setInstancesCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [firstResult, setFirstResult] = useState(0);

  // FETCH
  useEffect(() => {
    (async () => {
      const body = JSON.stringify({
        sortBy: 'endTime',
        sortOrder: 'desc',
        processDefinitionId,
        ...query,
      });

      setInstancesCount((await post(api, '/history/process-instance/count', {}, body)).count);

      setInstances(
        await post(api, '/history/process-instance', { maxResults: `${perPage}`, firstResult: `${firstResult}` }, body)
      );
    })();
  }, [query, firstResult]);

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
      .filter((expression: Expression) => expression.definition.type === 'executedActivityIdIn')
      .map((expression: Expression) => {
        return expression.value;
      });

    const startedDateExpression: Expression | undefined = validExpressions.find(
      (expression: Expression) => expression.definition.type === 'startedDate'
    );
    const finishedDateExpression: Expression | undefined = validExpressions.find(
      (expression: Expression) => expression.definition.type === 'finishedDate'
    );

    const rest = validExpressions.filter(
      (expression: Expression) =>
        ['variable', 'executedActivityIdIn', 'startedDate', 'finishedDate'].indexOf(expression.definition.type) === -1
    );

    let newQuery: any = {};
    rest.map((expression: Expression) => {
      newQuery[expression.definition.type] = castValue(expression.value);
    });

    if (startedDateExpression) {
      newQuery['startedBefore'] = startedDateExpression.operator === Operator.before ? castValue(startedDateExpression.value) + '.000+0000' : undefined;
      newQuery['startedAfter'] = startedDateExpression.operator === Operator.after ? castValue(startedDateExpression.value) + '.000+0000' : undefined;
    }

    if (finishedDateExpression) {
      newQuery['finishedBefore'] = finishedDateExpression.operator === Operator.before ? castValue(finishedDateExpression.value) + '.000+0000': undefined;
      newQuery['finishedAfter'] = finishedDateExpression.operator === Operator.after ? castValue(finishedDateExpression.value) + '.000+0000' : undefined;
    }

    if (activityIdInExpressions.length > 0) {
      newQuery['executedActivityIdIn'] = activityIdInExpressions;
    }
    if (variableExpressions.length > 0) {
      newQuery['variables'] = variableExpressions;
    }

    if (JSON.stringify(newQuery) !== JSON.stringify(query)) {
      setQuery(newQuery);
    }
  }, [expressions, processDefinitionId]);

  // Hack to ensure long living HTML node for filter box
  if (historyTabNode && !Array.from(historyTabNode.children).includes(root)) {
    historyTabNode.appendChild(root);
  }

  const pageClicked = (firstResult: number, page: number) => {
    setCurrentPage(page);
    setFirstResult(firstResult);
  };

  return historyTabNode ? (
    <Portal node={root}>
      <CamundaFilterBox
        availableExpressions={availableExpressions}
        expressions={expressions}
        setExpressions={setExpressions}
      />
      {/*<FilterBoxInstanceQueryOptions*/}
      {/*  options={InstanceQueryOptions}*/}
      {/*  autoCompleteHandler={autoCompleteHandler}*/}
      {/*  onParseOk={setExpressions}*/}
      {/*  defaultQuery={(): string => ''}*/}
      {/*/>*/}
      {instances.length ? <HistoryTable instances={instances} /> : null}
      <Pagination currentPage={currentPage} perPage={perPage} total={instancesCount} onPage={pageClicked}></Pagination>
    </Portal>
  ) : null;
};

export default [
  {
    id: 'definitionTabHistoricInstances',
    pluginPoint: 'cockpit.processDefinition.runtime.tab',
    properties: {
      label: 'History',
    },
    render: (node: Element) => hooks.setHistoryTabNode(node),
  },
  {
    id: 'definitionHistoricInstancesPlugin',
    pluginPoint: 'cockpit.processDefinition.runtime.action',
    render: (node: Element, { api, processDefinitionId }: DefinitionPluginParams) => {
      createRoot(node!).render(
        <React.StrictMode>
          <Plugin root={node} api={api} processDefinitionId={processDefinitionId} />
        </React.StrictMode>
      );
    },
  },
  {
    id: 'instanceDiagramHistoricToggle',
    pluginPoint: 'cockpit.processInstance.diagram.plugin',
    render: (viewer: any) => {
      (async () => {
        const buttons = document.createElement('div');
        buttons.style.cssText = `
          position: absolute;
          right: 15px;
          top: 60px;
        `;
        viewer._container.appendChild(buttons);
        createRoot(buttons!).render(
          <React.StrictMode>
            <ToggleHistoryViewButton
              onToggleHistoryView={(value: boolean) => {
                if (value) {
                  window.location.href =
                    window.location.href.split('#')[0] +
                    window.location.hash
                      .split('?')[0]
                      .replace(/^#\/process-instance/, '#/history/process-instance')
                      .replace(/\/runtime/, '/');
                }
              }}
              initial={false}
            />
          </React.StrictMode>
        );
      })();
    },
  },
  {
    id: 'instanceRouteHistory',
    pluginPoint: 'cockpit.route',
    properties: {
      path: '/history/process-instance/:id',
      label: '/history',
    },

    render: (node: Element, { api }: RoutePluginParams) => {
      const hash = window?.location?.hash ?? '';
      const match = hash.match(/\/history\/process-instance\/([^\/]*)/);
      const processInstanceId = match ? match[1].split('?')[0] : null;
      const settings = loadSettings();
      if (processInstanceId) {
        (async () => {
          const instance = await get(api, `/history/process-instance/${processInstanceId}`);
          const [{ version }, diagram, activities, variables, decisions] = await Promise.all([
            get(api, `/version`),
            get(api, `/process-definition/${instance.processDefinitionId}/xml`),
            get(api, '/history/activity-instance', { processInstanceId }),
            get(api, '/history/variable-instance', { processInstanceId }),
            get(api, '/history/decision-instance', { processInstanceId }),
          ]);
          const decisionByActivity: Map<string, any> = new Map(
            decisions.map((decision: any) => [decision.activityInstanceId, decision.id])
          );
          const activityById: Map<string, any> = new Map(activities.map((activity: any) => [activity.id, activity]));
          activities.sort((a: any, b: any) => {
            a = a.endTime ? new Date(a.endTime) : new Date();
            b = b.endTime ? new Date(b.endTime) : new Date();
            if (a > b) {
              return -1;
            }
            if (a < b) {
              return 1;
            }
            return 0;
          });
          variables.sort((a: any, b: any) => {
            a = a.name;
            b = b.name;
            if (a > b) {
              return 1;
            }
            if (a < b) {
              return -1;
            }
            return 0;
          });
          createRoot(node!).render(
            <React.StrictMode>
              <Page version={version ? (version as string) : '7.15.0'} api={api}>
                <BreadcrumbsPanel
                  processDefinitionId={instance.processDefinitionId}
                  processDefinitionName={instance.processDefinitionName}
                  processInstanceId={processInstanceId}
                />
                <Container>
                  <Allotment
                    vertical={true}
                    onChange={(numbers: number[]) => {
                      saveSettings({
                        ...loadSettings(),
                        topPaneSize: numbers?.[0] || null,
                      });
                    }}
                  >
                    <Allotment.Pane preferredSize={settings.topPaneSize || '66%'}>
                      <Allotment
                        vertical={false}
                        onChange={(numbers: number[]) => {
                          saveSettings({
                            ...loadSettings(),
                            leftPaneSize: numbers?.[0] || null,
                          });
                        }}
                      >
                        <Allotment.Pane preferredSize={settings.leftPaneSize || '33%'}>
                          <div className="ctn-column">
                            <dl className="process-information">
                              <dt>
                                <Clippy value={instance.id}>Instance ID:</Clippy>
                              </dt>
                              <dd>{instance.id}</dd>
                              <dt>
                                <Clippy value={instance.businessKey || 'null'}>Business Key:</Clippy>
                              </dt>
                              <dd>{instance.businessKey || 'null'}</dd>
                              <dt>
                                <Clippy value={instance.processDefinitionVersion}>Definition Version:</Clippy>
                              </dt>
                              <dd>{instance.processDefinitionVersion}</dd>
                              <dt>
                                <Clippy value={instance.processdefinitionid}>Definition ID:</Clippy>
                              </dt>
                              <dd>{instance.processDefinitionId}</dd>
                              <dt>
                                <Clippy value={instance.processDefinitionKey}>Definition Key:</Clippy>
                              </dt>
                              <dd>{instance.processDefinitionKey}</dd>
                              <dt>
                                <Clippy value={instance.processDefinitionName}>Definition Name:</Clippy>
                              </dt>
                              <dd>{instance.processDefinitionName}</dd>
                              <dt>
                                <Clippy value={instance.tenantId || 'null'}>Tenant ID:</Clippy>
                              </dt>
                              <dd>{instance.tenantId || 'null'}</dd>
                              <dt>
                                <Clippy value={instance.superProcessInstanceId}>Super Process instance ID:</Clippy>
                              </dt>
                              <dd>
                                {(instance.superProcessInstanceId && (
                                  <a href={`#/history/process-instance/${instance.superProcessInstanceId}`}>
                                    {instance.superProcessInstanceId}
                                  </a>
                                )) ||
                                  'null'}
                              </dd>
                              <dt>
                                <Clippy value={instance.state}>State</Clippy>
                              </dt>
                              <dd>{instance.state}</dd>
                            </dl>
                          </div>
                        </Allotment.Pane>
                        <Allotment.Pane>
                          <BPMN
                            activities={activities}
                            diagramXML={diagram.bpmn20Xml}
                            className="ctn-content"
                            style={{ width: '100%', height: '100%' }}
                            showRuntimeToggle={instance.state === 'ACTIVE'}
                          />
                        </Allotment.Pane>
                      </Allotment>
                    </Allotment.Pane>
                    <Allotment.Pane>
                      <Tabs className="ctn-row ctn-content-bottom ctn-tabbed" selectedTabClassName="active">
                        <TabList className="nav nav-tabs">
                          <Tab>
                            <a>Audit Log</a>
                          </Tab>
                          <Tab>
                            <a>Variables</a>
                          </Tab>
                        </TabList>
                        <TabPanel className="ctn-tabbed-content ctn-scroll">
                          <AuditLogTable activities={activities} decisions={decisionByActivity} />
                        </TabPanel>
                        <TabPanel className="ctn-tabbed-content ctn-scroll">
                          <VariablesTable instance={instance} activities={activityById} variables={variables} />
                        </TabPanel>
                      </Tabs>
                    </Allotment.Pane>
                  </Allotment>
                </Container>
              </Page>
            </React.StrictMode>
          );
        })();
      }
    },
  },
];

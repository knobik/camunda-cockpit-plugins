import './bootstrap.scss';
import './definition-batch-migration.scss';

import React from 'react';
import { createRoot } from 'react-dom/client';

import Container from './Components/Container';
import MigrationWizard from './Components/MigrationWizard';
import Page from './Components/Page';
import { DefinitionPluginParams, RoutePluginParams } from './types';
import { get } from './utils/api';

export default [
  {
    id: 'batchMigrationPlugin',
    pluginPoint: 'cockpit.processDefinition.runtime.action',
    render: (node: Element, { api, processDefinitionId }: DefinitionPluginParams) => {
      (async () => {
        const definition = await get(api, `/process-definition/${processDefinitionId}`);
        const versions = await get(api, '/process-definition', { key: definition.key });
        if (versions.length > 1) {
          createRoot(node!).render(
            <React.StrictMode>
              <button
                className="btn btn-default action-button"
                onClick={() => {
                  window.location.href = `#/migration/${definition.key}`;
                }}
              >
                Migrate
              </button>
            </React.StrictMode>
          );
        }
      })();
    },
  },
  {
    id: 'migrationRoute',
    pluginPoint: 'cockpit.route',
    properties: {
      path: '/migration/:processDefinitionKey',
      label: '/migration',
    },
    render: (node: Element, { api }: RoutePluginParams) => {
      const hash = window?.location?.hash ?? '';
      const match = hash.match(/\/migration\/([^\/]*)/);
      const processDefinitionKey = match ? match[1].split('?')[0] : null;
      if (processDefinitionKey) {
        (async () => {
          const { version } = await get(api, '/version');
          createRoot(node!).render(
            <React.StrictMode>
              <Page version={version} api={api}>
                <div className="breadcrumbs-panel" cam-breadcrumbs-panel="">
                  <ul className="cam-breadcrumb">
                    <li>
                      <a className="text" href="#/">
                        Dashboard
                      </a>
                    </li>
                    <li>
                      <span className="divider">&raquo;</span>
                      <a className="text" href="#/processes/">
                        Processes
                      </a>
                    </li>
                    <li>
                      <span className="divider">&raquo;</span>
                      <span className="text">Migration</span>
                    </li>
                  </ul>
                </div>
                <Container>
                  <MigrationWizard api={api} processDefinitionKey={processDefinitionKey} />
                </Container>
              </Page>
            </React.StrictMode>
          );
        })();
      }
    },
  },
];

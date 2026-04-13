import 'allotment/dist/style.css';

import { Allotment } from 'allotment';
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';
import camundaModdle from 'camunda-bpmn-moddle/resources/camunda.json';
import React, { useEffect, useRef, useState } from 'react';

import { API, MigrationInstructionDto, MigrationPlanDto, MigrationPlanReportDto } from '../types';
import { get, post } from '../utils/api';
import { MigrationState } from './MigrationWizard';

interface Props {
  api: API;
  state: MigrationState;
  updateState: (partial: Partial<MigrationState>) => void;
}

const createViewer = async (xml: string): Promise<any> => {
  const viewer = new BpmnViewer({
    moddleExtensions: { camunda: camundaModdle },
  });
  try {
    await viewer.importXML(xml);
  } catch (e) {
    // nothing we can do
  }
  return viewer;
};

const MigrationStep1Mapping: React.FC<Props> = ({ api, state, updateState }) => {
  const sourceRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const arrowSvgRef = useRef<SVGSVGElement | null>(null);
  const [sourceViewer, setSourceViewer] = useState<any>(null);
  const [targetViewer, setTargetViewer] = useState<any>(null);
  const [linkNavigation, setLinkNavigation] = useState(false);
  const [showMigrationPlan, setShowMigrationPlan] = useState(true);
  const [mappingMode, setMappingMode] = useState<{ sourceActivityId: string } | null>(null);
  const [arrowRedrawCounter, setArrowRedrawCounter] = useState(0);
  const [sourceStats, setSourceStats] = useState<Record<string, number>>({});
  const [targetStats, setTargetStats] = useState<Record<string, number>>({});

  // Fetch activity instance statistics
  useEffect(() => {
    if (!state.sourceProcessDefinitionId) return;
    (async () => {
      const stats = await get(api, `/process-definition/${state.sourceProcessDefinitionId}/statistics`);
      const map: Record<string, number> = {};
      for (const s of stats || []) {
        if (s.instances > 0) map[s.id] = s.instances;
      }
      setSourceStats(map);
    })();
  }, [state.sourceProcessDefinitionId]);

  useEffect(() => {
    if (!state.targetProcessDefinitionId) return;
    (async () => {
      const stats = await get(api, `/process-definition/${state.targetProcessDefinitionId}/statistics`);
      const map: Record<string, number> = {};
      for (const s of stats || []) {
        if (s.instances > 0) map[s.id] = s.instances;
      }
      setTargetStats(map);
    })();
  }, [state.targetProcessDefinitionId]);

  // Initialize source viewer
  useEffect(() => {
    if (!state.sourceDiagramXML || !sourceRef.current) return;
    (async () => {
      const viewer = await createViewer(state.sourceDiagramXML);
      sourceRef.current!.innerHTML = '';
      viewer.attachTo(sourceRef.current!);
      viewer.get('canvas').zoom('fit-viewport');
      setSourceViewer(viewer);
    })();
  }, [state.sourceDiagramXML]);

  // Initialize target viewer
  useEffect(() => {
    if (!state.targetDiagramXML || !targetRef.current) return;
    (async () => {
      const viewer = await createViewer(state.targetDiagramXML);
      targetRef.current!.innerHTML = '';
      viewer.attachTo(targetRef.current!);
      viewer.get('canvas').zoom('fit-viewport');
      setTargetViewer(viewer);
    })();
  }, [state.targetDiagramXML]);

  // Auto-generate migration plan when source/target change
  useEffect(() => {
    if (!state.sourceProcessDefinitionId || !state.targetProcessDefinitionId) return;
    if (state.sourceProcessDefinitionId === state.targetProcessDefinitionId) return;
    (async () => {
      const plan: MigrationPlanDto = await post(
        api,
        '/migration/generate',
        {},
        JSON.stringify({
          sourceProcessDefinitionId: state.sourceProcessDefinitionId,
          targetProcessDefinitionId: state.targetProcessDefinitionId,
          updateEventTriggers: false,
        })
      );
      if (plan && plan.instructions) {
        updateState({ instructions: plan.instructions });
      }
    })();
  }, [state.sourceProcessDefinitionId, state.targetProcessDefinitionId]);

  // Source diagram click handler
  useEffect(() => {
    if (!sourceViewer) return;
    const handler = (event: any) => {
      const element = event.element;
      if (element.type === 'bpmn:Process' || element.type === 'bpmn:Collaboration') return;

      // If clicking the same source activity again in mapping mode, cancel
      if (mappingMode && mappingMode.sourceActivityId === element.id) {
        setMappingMode(null);
        return;
      }

      // Check if already mapped — if so, remove mapping
      const existingIdx = state.instructions.findIndex(i => i.sourceActivityIds.includes(element.id));
      if (existingIdx >= 0) {
        const updated = [...state.instructions];
        updated.splice(existingIdx, 1);
        updateState({ instructions: updated });
        setMappingMode(null);
        return;
      }

      // Enter mapping mode
      setMappingMode({ sourceActivityId: element.id });
    };
    sourceViewer.get('eventBus').on('element.click', handler);
    return () => sourceViewer.get('eventBus').off('element.click', handler);
  }, [sourceViewer, state.instructions, mappingMode]);

  // Target diagram click handler
  useEffect(() => {
    if (!targetViewer) return;
    const handler = (event: any) => {
      const element = event.element;
      if (!mappingMode) return;
      if (element.type === 'bpmn:Process' || element.type === 'bpmn:Collaboration') return;

      const newInstruction: MigrationInstructionDto = {
        sourceActivityIds: [mappingMode.sourceActivityId],
        targetActivityIds: [element.id],
        updateEventTrigger: false,
      };
      updateState({ instructions: [...state.instructions, newInstruction] });
      setMappingMode(null);
    };
    targetViewer.get('eventBus').on('element.click', handler);
    return () => targetViewer.get('eventBus').off('element.click', handler);
  }, [targetViewer, mappingMode, state.instructions]);

  // Highlight source activity in mapping mode
  useEffect(() => {
    if (!sourceViewer) return;
    const canvas = sourceViewer.get('canvas');
    try {
      const elements = sourceViewer.get('elementRegistry').getAll();
      for (const el of elements) {
        canvas.removeMarker(el.id, 'migration-highlight');
      }
    } catch (e) {
      /* ignore */
    }

    if (mappingMode) {
      try {
        canvas.addMarker(mappingMode.sourceActivityId, 'migration-highlight');
      } catch (e) {
        /* ignore */
      }
    }
  }, [sourceViewer, mappingMode]);

  // Render instance count badges
  useEffect(() => {
    if (!sourceViewer) return;
    const overlays = sourceViewer.get('overlays');
    overlays.remove({ type: 'instance-count' });
    for (const [activityId, count] of Object.entries(sourceStats)) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.innerText = String(count);
      badge.style.cssText =
        'background: #1e88e5; color: white; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px;';
      try {
        overlays.add(activityId, 'instance-count', {
          position: { bottom: 17, left: -7 },
          html: badge,
        });
      } catch (e) {
        /* element may not exist */
      }
    }
  }, [sourceViewer, sourceStats]);

  useEffect(() => {
    if (!targetViewer) return;
    const overlays = targetViewer.get('overlays');
    overlays.remove({ type: 'instance-count' });
    for (const [activityId, count] of Object.entries(targetStats)) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.innerText = String(count);
      badge.style.cssText =
        'background: #1e88e5; color: white; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px;';
      try {
        overlays.add(activityId, 'instance-count', {
          position: { bottom: 17, left: -7 },
          html: badge,
        });
      } catch (e) {
        /* element may not exist */
      }
    }
  }, [targetViewer, targetStats]);

  // Render mapping overlays (badges)
  useEffect(() => {
    if (!sourceViewer || !targetViewer) return;

    const sourceOverlays = sourceViewer.get('overlays');
    const targetOverlays = targetViewer.get('overlays');

    // Clear previous overlays
    sourceOverlays.remove({ type: 'migration-badge' });
    targetOverlays.remove({ type: 'migration-badge' });

    const failuresBySource = new Map<string, string[]>();
    if (state.validationReport) {
      for (const report of state.validationReport.instructionReports) {
        if (report.failures.length > 0) {
          for (const sourceId of report.instruction.sourceActivityIds) {
            failuresBySource.set(sourceId, report.failures);
          }
        }
      }
    }

    for (const instruction of state.instructions) {
      const sourceId = instruction.sourceActivityIds[0];
      const targetId = instruction.targetActivityIds[0];
      const failures = failuresBySource.get(sourceId);
      const hasError = failures && failures.length > 0;

      // Source badge
      const sourceBadge = document.createElement('span');
      sourceBadge.className = `migration-badge ${hasError ? 'error' : 'success'}`;
      sourceBadge.innerHTML = hasError ? '&#x2716;' : '&#x2714;';
      if (hasError) {
        sourceBadge.title = failures!.join('\n');
        sourceBadge.style.cursor = 'pointer';
        sourceBadge.addEventListener('click', e => {
          e.stopPropagation();
          const existing = document.querySelector('.migration-error-popover');
          if (existing) existing.remove();

          const popover = document.createElement('div');
          popover.className = 'migration-error-popover';
          popover.innerHTML = `
            <div class="migration-error-popover-title">Mapping Error</div>
            <div class="migration-error-popover-body">${failures!.join('<br/>')}</div>
          `;
          sourceBadge.parentElement?.appendChild(popover);

          const close = (ev: MouseEvent) => {
            if (!popover.contains(ev.target as Node)) {
              popover.remove();
              document.removeEventListener('click', close);
            }
          };
          setTimeout(() => document.addEventListener('click', close), 0);
        });
      }

      // Target badge
      const targetBadge = document.createElement('span');
      targetBadge.className = `migration-badge ${hasError ? 'error' : 'success'}`;
      targetBadge.innerHTML = hasError ? '&#x2716;' : '&#x2714;';
      if (hasError) {
        targetBadge.title = failures!.join('\n');
        targetBadge.style.cursor = 'pointer';
        targetBadge.addEventListener('click', e => {
          e.stopPropagation();
          const existing = document.querySelector('.migration-error-popover');
          if (existing) existing.remove();

          const popover = document.createElement('div');
          popover.className = 'migration-error-popover';
          popover.innerHTML = `
            <div class="migration-error-popover-title">Mapping Error</div>
            <div class="migration-error-popover-body">${failures!.join('<br/>')}</div>
          `;
          targetBadge.parentElement?.appendChild(popover);

          const close = (ev: MouseEvent) => {
            if (!popover.contains(ev.target as Node)) {
              popover.remove();
              document.removeEventListener('click', close);
            }
          };
          setTimeout(() => document.addEventListener('click', close), 0);
        });
      }

      try {
        sourceOverlays.add(sourceId, 'migration-badge', {
          position: { top: -7, right: 7 },
          html: sourceBadge,
        });
      } catch (e) {
        /* element may not exist */
      }

      try {
        targetOverlays.add(targetId, 'migration-badge', {
          position: { top: -7, right: 7 },
          html: targetBadge,
        });
      } catch (e) {
        /* element may not exist */
      }
    }
  }, [sourceViewer, targetViewer, state.instructions, state.validationReport]);

  // Validate migration plan on instruction changes
  useEffect(() => {
    if (!state.sourceProcessDefinitionId || !state.targetProcessDefinitionId) return;
    if (state.instructions.length === 0) {
      updateState({ validationReport: null });
      return;
    }

    const timer = setTimeout(async () => {
      const report: MigrationPlanReportDto = await post(
        api,
        '/migration/validate',
        {},
        JSON.stringify({
          sourceProcessDefinitionId: state.sourceProcessDefinitionId,
          targetProcessDefinitionId: state.targetProcessDefinitionId,
          instructions: state.instructions,
          variables: Object.keys(state.variables).length > 0 ? state.variables : undefined,
        })
      );
      if (report && report.instructionReports) {
        updateState({ validationReport: report });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [state.instructions, state.variables, state.sourceProcessDefinitionId, state.targetProcessDefinitionId]);

  // Draw mapping arrows
  useEffect(() => {
    if (!arrowSvgRef.current || !sourceViewer || !targetViewer) return;
    if (!showMigrationPlan && !mappingMode) {
      arrowSvgRef.current.innerHTML = '';
      return;
    }

    const svg = arrowSvgRef.current;
    const containerRect = svg.parentElement!.getBoundingClientRect();
    svg.innerHTML = '';
    svg.setAttribute('width', String(containerRect.width));
    svg.setAttribute('height', String(containerRect.height));

    // Create arrowhead markers
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const createMarker = (id: string, color: string) => {
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', id);
      marker.setAttribute('viewBox', '0 0 10 10');
      marker.setAttribute('refX', '7');
      marker.setAttribute('refY', '5');
      marker.setAttribute('markerWidth', '6');
      marker.setAttribute('markerHeight', '6');
      marker.setAttribute('orient', 'auto-start-reverse');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
      path.setAttribute('fill', color);
      marker.appendChild(path);
      return marker;
    };
    const createCircleMarker = (id: string, color: string) => {
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', id);
      marker.setAttribute('viewBox', '0 0 10 10');
      marker.setAttribute('refX', '5');
      marker.setAttribute('refY', '5');
      marker.setAttribute('markerWidth', '5');
      marker.setAttribute('markerHeight', '5');
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '5');
      circle.setAttribute('cy', '5');
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', color);
      marker.appendChild(circle);
      return marker;
    };
    defs.appendChild(createMarker('arrow-green', '#5cb85c'));
    defs.appendChild(createMarker('arrow-red', '#d9534f'));
    defs.appendChild(createCircleMarker('circle-green', '#5cb85c'));
    defs.appendChild(createCircleMarker('circle-red', '#d9534f'));
    svg.appendChild(defs);

    const failuresBySource = new Map<string, string[]>();
    if (state.validationReport) {
      for (const report of state.validationReport.instructionReports) {
        if (report.failures.length > 0) {
          for (const sourceId of report.instruction.sourceActivityIds) {
            failuresBySource.set(sourceId, report.failures);
          }
        }
      }
    }

    const instructionsToShow = showMigrationPlan
      ? state.instructions
      : mappingMode
      ? state.instructions.filter(i => i.sourceActivityIds.includes(mappingMode.sourceActivityId))
      : [];

    for (const instruction of instructionsToShow) {
      const sourceId = instruction.sourceActivityIds[0];
      const targetId = instruction.targetActivityIds[0];

      try {
        const sourceGfx = sourceViewer.get('elementRegistry').getGraphics(sourceId);
        const targetGfx = targetViewer.get('elementRegistry').getGraphics(targetId);
        if (!sourceGfx || !targetGfx) continue;

        const sourceBbox = sourceGfx.getBoundingClientRect();
        const targetBbox = targetGfx.getBoundingClientRect();

        const hasError = failuresBySource.has(sourceId);
        const color = hasError ? '#d9534f' : '#5cb85c';
        const markerId = hasError ? 'arrow-red' : 'arrow-green';
        const circleId = hasError ? 'circle-red' : 'circle-green';

        const x1 = sourceBbox.right - containerRect.left;
        const y1 = sourceBbox.top + sourceBbox.height / 2 - containerRect.top;
        const x2 = targetBbox.left - containerRect.left;
        const y2 = targetBbox.top + targetBbox.height / 2 - containerRect.top;

        const midX = (x1 + x2) / 2;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`);
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.setAttribute('marker-start', `url(#${circleId})`);
        path.setAttribute('marker-end', `url(#${markerId})`);
        svg.appendChild(path);
      } catch (e) {
        /* element may not exist in one of the viewers */
      }
    }
  }, [
    sourceViewer,
    targetViewer,
    state.instructions,
    state.validationReport,
    showMigrationPlan,
    mappingMode,
    arrowRedrawCounter,
  ]);

  // Redraw arrows on pan/zoom
  useEffect(() => {
    if (!sourceViewer || !targetViewer) return;
    const redraw = () => setArrowRedrawCounter(c => c + 1);

    sourceViewer.get('eventBus').on('canvas.viewbox.changed', redraw);
    targetViewer.get('eventBus').on('canvas.viewbox.changed', redraw);

    const resizeObserver = new ResizeObserver(redraw);
    if (sourceRef.current) resizeObserver.observe(sourceRef.current);
    if (targetRef.current) resizeObserver.observe(targetRef.current);

    return () => {
      resizeObserver.disconnect();
      try {
        sourceViewer.get('eventBus').off('canvas.viewbox.changed', redraw);
      } catch (e) {}
      try {
        targetViewer.get('eventBus').off('canvas.viewbox.changed', redraw);
      } catch (e) {}
    };
  }, [sourceViewer, targetViewer]);

  // Linked navigation
  useEffect(() => {
    if (!sourceViewer || !targetViewer || !linkNavigation) return;

    let syncing = false;
    const syncToTarget = () => {
      if (syncing) return;
      syncing = true;
      try {
        const sourceViewbox = sourceViewer.get('canvas').viewbox();
        targetViewer.get('canvas').viewbox({
          x: sourceViewbox.x,
          y: sourceViewbox.y,
          width: sourceViewbox.width,
          height: sourceViewbox.height,
        });
      } catch (e) {}
      syncing = false;
    };
    const syncToSource = () => {
      if (syncing) return;
      syncing = true;
      try {
        const targetViewbox = targetViewer.get('canvas').viewbox();
        sourceViewer.get('canvas').viewbox({
          x: targetViewbox.x,
          y: targetViewbox.y,
          width: targetViewbox.width,
          height: targetViewbox.height,
        });
      } catch (e) {}
      syncing = false;
    };

    sourceViewer.get('eventBus').on('canvas.viewbox.changed', syncToTarget);
    targetViewer.get('eventBus').on('canvas.viewbox.changed', syncToSource);

    return () => {
      try {
        sourceViewer.get('eventBus').off('canvas.viewbox.changed', syncToTarget);
      } catch (e) {}
      try {
        targetViewer.get('eventBus').off('canvas.viewbox.changed', syncToSource);
      } catch (e) {}
    };
  }, [sourceViewer, targetViewer, linkNavigation]);

  const handleSourceVersionChange = async (definitionId: string) => {
    const xml = await get(api, `/process-definition/${definitionId}/xml`);
    updateState({
      sourceProcessDefinitionId: definitionId,
      sourceDiagramXML: xml.bpmn20Xml,
      instructions: [],
      validationReport: null,
    });
  };

  const handleTargetVersionChange = async (definitionId: string) => {
    const xml = await get(api, `/process-definition/${definitionId}/xml`);
    updateState({
      targetProcessDefinitionId: definitionId,
      targetDiagramXML: xml.bpmn20Xml,
      instructions: [],
      validationReport: null,
    });
  };

  return (
    <div className="migration-mapping">
      <div className="migration-mapping-header">
        <div className="migration-mapping-version">
          <label>Source:</label>
          <select
            className="form-control"
            value={state.sourceProcessDefinitionId}
            onChange={e => handleSourceVersionChange(e.target.value)}
          >
            {state.sourceVersions.map(v => (
              <option key={v.id} value={v.id}>
                {v.name || v.key} (version {v.version})
              </option>
            ))}
          </select>
        </div>
        <div className="migration-mapping-version">
          <label>Target:</label>
          <select
            className="form-control"
            value={state.targetProcessDefinitionId}
            onChange={e => handleTargetVersionChange(e.target.value)}
          >
            {state.sourceVersions.map(v => (
              <option key={v.id} value={v.id}>
                {v.name || v.key} (version {v.version})
              </option>
            ))}
          </select>
        </div>
      </div>

      {mappingMode && (
        <div className="migration-mapping-mode-hint">
          Select a target activity on the right diagram to map from <strong>{mappingMode.sourceActivityId}</strong>.
          Click the source activity again to cancel.
        </div>
      )}

      <div className="migration-diagrams-container">
        <Allotment>
          <Allotment.Pane>
            <div className="migration-diagram" ref={sourceRef} />
          </Allotment.Pane>
          <Allotment.Pane>
            <div className="migration-diagram" ref={targetRef} />
          </Allotment.Pane>
        </Allotment>
        <svg className="migration-arrows-overlay" ref={arrowSvgRef} />
      </div>

      <div className="migration-mapping-controls">
        <label className="checkbox-inline">
          <input type="checkbox" checked={linkNavigation} onChange={e => setLinkNavigation(e.target.checked)} />
          Link diagrams navigation
        </label>
        <label className="checkbox-inline" style={{ marginLeft: '20px' }}>
          <input type="checkbox" checked={showMigrationPlan} onChange={e => setShowMigrationPlan(e.target.checked)} />
          Show migration plan
        </label>
      </div>

      {state.instructions.length > 0 && (
        <div className="migration-mapping-table">
          <h4>Migration Plan</h4>
          <table className="cam-table">
            <thead>
              <tr>
                <th>Source Activity</th>
                <th>Target Activity</th>
                <th>Errors</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.instructions.map((instruction, index) => {
                const sourceId = instruction.sourceActivityIds[0];
                const targetId = instruction.targetActivityIds[0];
                const failures = state.validationReport?.instructionReports?.find(
                  r => r.instruction.sourceActivityIds[0] === sourceId
                )?.failures;
                const hasError = failures && failures.length > 0;
                return (
                  <tr key={index} style={hasError ? { background: '#fdf2f2' } : {}}>
                    <td>{sourceId}</td>
                    <td>{targetId}</td>
                    <td>{hasError ? <span className="text-danger">{failures!.join(', ')}</span> : <span className="text-success">OK</span>}</td>
                    <td>
                      <button
                        className="btn btn-xs btn-danger"
                        onClick={() => {
                          const updated = [...state.instructions];
                          updated.splice(index, 1);
                          updateState({ instructions: updated });
                        }}
                      >
                        <span className="glyphicon glyphicon-trash" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MigrationStep1Mapping;

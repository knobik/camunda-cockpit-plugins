import moment from 'moment';
import React from 'react';
import { GoChevronDown, GoChevronUp } from 'react-icons/go';
import { TiMinus } from 'react-icons/ti';
import { useSortBy, useTable } from 'react-table';

import { Clippy } from './Clippy';
import { FilteredProcessInstance } from './ProcessInstanceSelectModal';

interface Props {
  instances: any[];
  selectedInstances: string[];
  setSelectedInstances: (selectedInstances: string[]) => void;
}

const HistoryTable: React.FC<Props> = ({ instances, selectedInstances, setSelectedInstances }) => {
  const columns = React.useMemo(
    () => [
      {
        Header: 'State',
        accessor: 'state',
        Cell: ({ value }: any) => <Clippy value={value}>{value}</Clippy>,
      },
      {
        Header: 'Instance ID',

        Cell: ({ value }: any) => (
          <Clippy value={value}>
            <a href={`#/history/process-instance/${value}`}>{value}</a>
          </Clippy>
        ),
        accessor: 'id',
      },
      {
        Header: 'Start Time',
        accessor: 'startTime',
        Cell: ({ value }: any) => (
          <Clippy value={value ? value.format('YYYY-MM-DDTHH:mm:ss') : value}>
            {value ? value.format('YYYY-MM-DDTHH:mm:ss') : value}
          </Clippy>
        ),
      },
      {
        Header: 'End Time',
        accessor: 'endTime',
        Cell: ({ value }: any) => (
          <Clippy value={value ? value.format('YYYY-MM-DDTHH:mm:ss') : value}>
            {value ? value.format('YYYY-MM-DDTHH:mm:ss') : value}
          </Clippy>
        ),
      },
      {
        Header: 'Business Key',
        accessor: 'businessKey',
        Cell: ({ value }: any) => <Clippy value={value}>{value}</Clippy>,
      },
    ],
    []
  );
  const data = React.useMemo(
    () =>
      instances.map((instance: any) => {
        return {
          state: instance.state,
          id: instance.id,
          businessKey: instance.businessKey,
          startTime: moment(instance.startTime),
          endTime: instance.endTime ? moment(instance.endTime) : '',
        };
      }),
    [instances]
  );
  const tableInstance = useTable({ columns: columns as any, data }, useSortBy);
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;

  function toggleSelected(id: string) {
    if (selectedInstances.includes(id)) {
      setSelectedInstances(selectedInstances.filter(i => i !== id));
    } else {
      setSelectedInstances([...selectedInstances, id]);
    }
  }

  function toggleAll() {
    if (selectedInstances.length === instances.length) {
      setSelectedInstances([]);
    } else {
      setSelectedInstances(instances.map((instance: any) => instance.id));
    }
  }

  return (
    <table className="cam-table" {...getTableProps()}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            <th>
              <input
                type="checkbox"
                checked={selectedInstances.length === instances.length}
                onChange={toggleAll}
              />
            </th>
            {headerGroup.headers.map(column => (
              /* @ts-ignore */
              <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                {column.render('Header')}
                <span style={{ position: 'absolute', fontSize: '125%' }}>
                  {
                    /* @ts-ignore */
                    column.isSorted ? (
                      /* @ts-ignore */
                      column.isSortedDesc ? (
                        <GoChevronDown style={{ color: '#155cb5' }} />
                      ) : (
                        <GoChevronUp style={{ color: '#155cb5' }} />
                      )
                    ) : (
                      <TiMinus style={{ color: '#155cb5' }} />
                    )
                  }
                </span>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedInstances.includes(row.original.id)}
                  onChange={() => toggleSelected(row.original.id)}
                />
              </td>
              {row.cells.map(cell => {
                return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default HistoryTable;

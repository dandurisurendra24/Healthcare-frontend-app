import React from 'react';
import './Table.css';

const fallbackAccessor = (row, header) => row?.[header.toLowerCase().replace(/\s+/g, '_')] ?? row?.[header];

const Table = ({ columns, headers = [], data = [], actions = [], emptyMessage = 'No data available', onRowClick }) => {
  const resolvedColumns =
    columns ||
    headers.map((header) => ({
      header,
      accessor: (row) => fallbackAccessor(row, header),
    }));

  if (!data.length) {
    return <div className="table-empty">{emptyMessage}</div>;
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {resolvedColumns.map((column) => (
              <th key={column.header}>{column.header}</th>
            ))}
            {actions.length > 0 && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={row.id || row._id || row.report_id || row.prescription_id || row.patient_id || index}
              className={onRowClick ? 'table-row-clickable' : ''}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {resolvedColumns.map((column) => (
                <td key={column.header}>{column.render ? column.render(row) : column.accessor(row)}</td>
              ))}
              {actions.length > 0 && (
                <td>
                  <div className="table-actions">
                    {actions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        className={`action-btn action-${action.type || 'primary'}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          action.onClick(row);
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;

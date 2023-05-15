import React, { useMemo } from "react";
import { useTable, useExpanded } from "react-table";

function renderRow(row, visibleColumns) {
  return (
    <React.Fragment key={row.getRowProps().key}>
      <tr>
        {row.cells.map(cell => {
          return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
        })}
      </tr>
      {row.isExpanded ? (
        <tr>
          <td colSpan={visibleColumns.length}>
            {row.values.key} Details:
            {row.subRows.map(subRow => {
              return (
                <div key={subRow.id}>
                  {subRow.values.key}: {subRow.values.value}
                  {subRow.subRows && subRow.subRows.map(renderRow)}
                </div>
              );
            })}
          </td>
        </tr>
      ) : null}
    </React.Fragment>
  );
}

function Table({ columns, data }) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    visibleColumns,
    state: { expanded }
  } = useTable({ columns, data }, useExpanded);

  
  return (
    <table {...getTableProps()}>
      <thead>
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <th {...column.getHeaderProps()}>{column.render("Header")}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row) => {
          prepareRow(row);
          return renderRow(row, visibleColumns);


        })}
      </tbody>
    </table>
  );
}


export default function App() {
  const columns = useMemo(
    () => [
      {
        Header: "Key",
        accessor: "key",
        Cell: ({ row, value }) => (
          <span {...row.getToggleRowExpandedProps()}>
            {row.isExpanded ? "👇" : "👉"} {value}
          </span>
        )
      },
      {
        Header: "Value",
        accessor: "value"
      }
    ],
    []
  );

  const data = useMemo(
    () => [
      {
        key: "STEPHEN",
        value: "Details",
        subRows: [
          {
            key: "STEPHEN_AGE",
            value: "30"
          },
          {
            key: "STEPHEN_WEIGHT",
            value: "180 lbs"
          }
        ]
      }
      // ... more data
    ],
    []
  );

  return <Table columns={columns} data={data} />;
}

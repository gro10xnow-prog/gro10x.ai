> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Data Display

> Components for displaying structured data — Table and Chart.

## Table

A structured data table built from rows and cells. Use `TableRow` and `TableCell` to define the table structure declaratively.

```jsx theme={null}
<Table>
  <TableRow header>
    <TableCell>Name</TableCell>
    <TableCell>Price</TableCell>
  </TableRow>
  <TableRow>
    <TableCell>{name}</TableCell>
    <TableCell>{price}</TableCell>
  </TableRow>
</Table>
```

<Tip>
  Mark a `TableRow` with `header` to render it with bold text and a background color, making it easy to distinguish column headings from data rows.
</Tip>

### TableRow Props

| Prop | Type | Default | Description |
| - | - | - | - |
| `header` | boolean | `false` | Render as a header row with bold text and background styling. |

### TableCell Props

| Prop | Type | Default | Description |
| - | - | - | - |
| `width` | number \| string | — | Custom cell width. |
| `colSize` | `xs` \| `sm` \| `md` \| `lg` \| `xl` | — | Preset width. `xs`: 60px, `sm`: 100px, `md`: 160px, `lg`: 240px, `xl`: 320px. |
| `colSpan` | number | — | Number of columns this cell spans. |
| `rowSpan` | number | — | Number of rows this cell spans. |
| `padding` | spacing | — | Cell padding. |
| `align` | `start` \| `center` \| `end` | — | Horizontal alignment of the cell content. |
| `vAlign` | `start` \| `center` \| `end` | — | Vertical alignment of the cell content. |

***

## Chart

Data visualization component supporting bar, line, and area charts. You can combine multiple series in a single chart to overlay different visualization types.

```jsx theme={null}
<Chart
  data={salesData}
  xAxis="month"
  series={[
    { dataKey: "revenue", label: "Revenue", type: "bar", color: "#4f46e5" },
    { dataKey: "target", label: "Target", type: "line", color: "#ef4444" }
  ]}
/>
```

<Info>
  Each entry in the `series` array defines one data series. You can mix `bar`, `line`, and `area` types in the same chart to create composite visualizations like a bar chart with a trend line overlay.
</Info>

### Props

| Prop | Type | Default | Description |
| - | - | - | - |
| `data` | array of objects | — | The dataset to visualize. Each object represents one data point. |
| `series` | array | — | Array of series definitions. See [series options](#series-options) below. |
| `xAxis` | string \| `{dataKey, hide?, labels?}` | — | The data key for the x-axis, or an object for advanced configuration. |
| `yAxis` | `{domain?}` | — | Y-axis configuration. `domain` accepts numbers, `"auto"`, `"dataMin"`, or `"dataMax"`. |
| `showLegend` | boolean | `true` | Show or hide the chart legend. |
| `showTooltip` | boolean | `true` | Show or hide tooltips on hover. |
| `showYAxis` | boolean | `false` | Show or hide the y-axis labels. |
| `barGap` | number | — | Gap between bars within the same category. |
| `barCategoryGap` | number | — | Gap between bar categories. |
| `width` | number \| string | — | Explicit chart width. |
| `height` | number \| string | — | Explicit chart height. |
| `minHeight` | number | `200` | Minimum chart height in pixels. |
| `flex` | number \| string | — | Flex grow/shrink behavior. |

### Series Options

Each object in the `series` array accepts:

| Prop | Type | Description |
| - | - | - |
| `dataKey` | string | The key in the data objects for this series' values. |
| `label` | string | Display label for the series in legend and tooltip. |
| `type` | `bar` \| `line` \| `area` | Visualization type. |
| `color` | string | Series color. |
| `stack` | string | Optional stack group. Series with the same `stack` value are stacked together. |
| `curveType` | string | Optional curve interpolation type for line and area charts. |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
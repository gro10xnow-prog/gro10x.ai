> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Layout

> Layout components for structuring widget content — Card, Box, Col, Row, Spacer, Divider, ListView, and ListViewItem.

## Common Layout Props

`Box`, `Col`, and `Row` all share the following props for controlling spacing, sizing, and alignment.

| Prop | Type | Description |
| - | - | - |
| `padding` | spacing | Inner spacing. |
| `border` | border | Border width, color, and style. |
| `radius` | radius | Corner rounding. |
| `background` | color | Background color. |
| `width` | number \| string | Explicit width. |
| `height` | number \| string | Explicit height. |
| `minWidth` | number \| string | Minimum width constraint. |
| `maxWidth` | number \| string | Maximum width constraint. |
| `minHeight` | number \| string | Minimum height constraint. |
| `maxHeight` | number \| string | Maximum height constraint. |
| `gap` | number \| string | Spacing between children. |
| `align` | `start` \| `center` \| `end` \| `baseline` \| `stretch` | Cross-axis alignment. |
| `justify` | `start` \| `center` \| `end` \| `between` \| `around` \| `evenly` \| `stretch` | Main-axis distribution. |
| `flex` | number \| string | Flex grow/shrink behavior. |
| `flush` | boolean | Extend to parent edges, ignoring padding. Defaults to `false`. |
| `scrollable` | boolean | Enable scrolling when content overflows. Defaults to `false`. |

<Tip>
  These common props let you control layout behavior consistently across `Box`, `Col`, and `Row` without needing to remember different APIs for each.
</Tip>

***

## Card

The root container for widget content. Every widget code starts with a `Card` component as the outermost wrapper.

```jsx theme={null}
<Card size="md">
  <Title value={title} size="sm" />
  <Text value={description} color="secondary" />
</Card>
```

### Props

| Prop | Type | Default | Description |
| - | - | - | - |
| `size` | `sm` \| `md` \| `lg` \| `full` | `md` | Controls the overall width of the card. |
| `padding` | spacing | — | Inner spacing of the card. |
| `background` | color | — | Background color. |
| `border` | border | — | Border width, color, and style. |
| `status` | `{text, icon?}` or `{text, favicon?, frame?}` | — | Displays a status indicator at the top of the card. |
| `confirm` | `{label, action}` | — | Adds a confirm button to the card footer. |
| `cancel` | `{label, action}` | — | Adds a cancel button to the card footer. |
| `asForm` | boolean | `false` | Wraps the card content in a form element. |
| `collapsed` | boolean | `false` | Renders the card in a collapsed state. |
| `theme` | `light` \| `dark` | — | Forces a specific color theme for the card. |

<Note>
  When `confirm` or `cancel` are provided, the card automatically renders action buttons in the footer. If `asForm` is `true`, the confirm button acts as the form submit button.
</Note>

***

## Box

A generic flex container for arranging child elements in any direction.

```jsx theme={null}
<Box direction="row" align="center" gap={3} padding={4}>
  <Icon name="star" />
  <Text value="Featured" />
</Box>
```

### Props

In addition to all [common layout props](#common-layout-props), `Box` accepts:

| Prop | Type | Default | Description |
| - | - | - | - |
| `direction` | `row` \| `col` | — | Sets the flex direction of the container. |
| `wrap` | `nowrap` \| `wrap` \| `wrap-reverse` | — | Controls whether children wrap to new lines. |
| `size` | number \| string | — | Shorthand for setting both `width` and `height` to the same value. |
| `minSize` | number \| string | — | Shorthand for setting both `minWidth` and `minHeight`. |
| `maxSize` | number \| string | — | Shorthand for setting both `maxWidth` and `maxHeight`. |
| `aspectRatio` | number \| string | — | Sets a fixed aspect ratio for the container. |

***

## Col

A vertical flex container. This is a shorthand for `Box` with a column direction, making it the go-to choice for stacking elements vertically.

```jsx theme={null}
<Col gap={2}>
  <Title value={title} size="sm" />
  <Text value={subtitle} color="secondary" />
</Col>
```

### Props

`Col` accepts all [common layout props](#common-layout-props) and the same additional props as `Box` (`wrap`, `size`, `minSize`, `maxSize`, `aspectRatio`), except `direction`, which is always set to column.

***

## Row

A horizontal flex container. This is a shorthand for `Box` with a row direction, making it the go-to choice for placing elements side by side.

```jsx theme={null}
<Row gap={3} align="center">
  <Image src={avatar} size={40} radius="full" />
  <Text value={name} weight="semibold" />
  <Spacer />
  <Button label="View" variant="outline" />
</Row>
```

### Props

`Row` accepts all [common layout props](#common-layout-props) and the same additional props as `Box` (`wrap`, `size`, `minSize`, `maxSize`, `aspectRatio`), except `direction`, which is always set to row.

<Info>
  Combine `Row` with `Spacer` to push elements to opposite ends of a container — a common pattern for headers, toolbars, and list items.
</Info>

***

## Spacer

A flexible empty space that expands to fill available room along the main axis. Use it to push sibling elements apart within a `Row` or `Col`.

```jsx theme={null}
<Row>
  <Text value="Left" />
  <Spacer />
  <Text value="Right" />
</Row>
```

### Props

| Prop | Type | Default | Description |
| - | - | - | - |
| `minSize` | number \| string | — | Sets a minimum size for the spacer, ensuring it never shrinks below this value. |

***

## Divider

A horizontal line separator for visually breaking content into sections.

```jsx theme={null}
<Col>
  <Text value="Section 1" />
  <Divider />
  <Text value="Section 2" />
</Col>
```

### Props

| Prop | Type | Default | Description |
| - | - | - | - |
| `spacing` | number \| string | — | Vertical space above and below the divider. |
| `color` | color | — | Color of the divider line. |
| `size` | number \| string | — | Thickness of the divider line. |
| `flush` | boolean | `false` | Extend the divider to the parent edges, ignoring padding. |

***

## ListView

A scrollable list container for rendering collections of items. Use with `ListViewItem` to define each entry.

```jsx theme={null}
<ListView orientation="vertical" gap={2} limit={5}>
  <ListViewItem>
    <Text value={itemName} />
  </ListViewItem>
</ListView>
```

### Props

| Prop | Type | Default | Description |
| - | - | - | - |
| `orientation` | `horizontal` \| `vertical` | — | Scroll direction of the list. |
| `gap` | number | — | Spacing between list items. |
| `limit` | number \| `"auto"` | — | Maximum number of visible items before scrolling. |
| `status` | `{text, icon?}` or `{text, favicon?, frame?}` | — | Displays a status indicator on the list. |
| `theme` | `light` \| `dark` | — | Forces a specific color theme for the list. |

<Tip>
  Set `limit` to control how many items are visible at once. Items beyond the limit become accessible through scrolling, keeping the widget compact.
</Tip>

***

## ListViewItem

An individual item inside a `ListView`. Items can be made interactive by providing an `onClickAction`.

```jsx theme={null}
<ListViewItem onClickAction={{ functionName: "selectItem" }} gap={3} align="center">
  <Image src={thumbnail} size={40} />
  <Text value={itemName} />
</ListViewItem>
```

### Props

| Prop | Type | Default | Description |
| - | - | - | - |
| `align` | flex align | — | Cross-axis alignment of the item's children. |
| `gap` | number | — | Spacing between child elements within the item. |
| `onClickAction` | action | — | Action to execute when the item is clicked. Makes the item interactive. |

<Info>
  When `onClickAction` is set, the item renders as a clickable element with hover and focus styles applied automatically.
</Info>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Text

> Text components for displaying content — Text, Title, Caption, Label, and Markdown.

Text components handle all readable content in your widget — from body copy and headings to form labels and Markdown-formatted blocks. Five components cover the full range of text needs: **Text**, **Title**, **Caption**, **Label**, and **Markdown**.

## Common Props

The **Text**, **Title**, and **Caption** components share a set of common props for controlling content and appearance.

| Prop | Type | Default | Description |
| - | - | - | - |
| `value` | `string` | — | The text content to display. |
| `color` | `color` | — | Text color. |
| `textAlign` | `start` \| `center` \| `end` | — | Horizontal text alignment. |
| `truncate` | `boolean` | `false` | Truncate overflowing text with an ellipsis. |
| `maxLines` | `number` | — | Maximum number of visible lines. Content beyond this limit is hidden. |

***

## Text

The most common component for displaying body text. Use it for dynamic content such as descriptions, paragraphs, and inline values.

```jsx theme={null}
<Text value={description} size="sm" color="secondary" maxLines={3} />
```

### Props

In addition to the [common props](#common-props), `Text` supports:

| Prop | Type | Default | Description |
| - | - | - | - |
| `size` | `xs` \| `sm` \| `md` \| `lg` \| `xl` | `md` | Font size. |
| `weight` | `normal` \| `medium` \| `semibold` \| `bold` | `normal` | Font weight. |
| `width` | `number` | — | Fixed width for the text element. |
| `italic` | `boolean` | — | Render text in italic. |
| `lineThrough` | `boolean` | — | Apply a strikethrough style. |
| `tabularNums` | `boolean` | — | Use tabular (monospaced) number figures for aligned columns. |
| `minLines` | `number` | — | Minimum number of lines the element occupies. |

<Tip>
  Use `tabularNums` when displaying numbers in tables or lists — it ensures digits are evenly spaced so columns stay aligned.
</Tip>

***

## Title

Heading text with larger, bolder sizing. Use it for section headers, card titles, and any prominent label.

```jsx theme={null}
<Title value="Order Summary" size="lg" />
```

### Props

In addition to the [common props](#common-props), `Title` supports:

| Prop | Type | Default | Description |
| - | - | - | - |
| `size` | `xs` \| `sm` \| `md` \| `base` \| `lg` \| `xl` \| `2xl` \| `3xl` \| `4xl` \| `5xl` \| `6xl` | `md` | Font size. |
| `weight` | `normal` \| `medium` \| `semibold` \| `bold` | `bold` | Font weight. |
| `width` | `number` | — | Fixed width for the title element. |
| `tabularNums` | `boolean` | — | Use tabular (monospaced) number figures. |

***

## Caption

Smaller secondary text for annotations, timestamps, and supplementary details. Caption preserves line breaks in the provided value.

```jsx theme={null}
<Caption value="Last updated 2 minutes ago" size="sm" color="secondary" />
```

### Props

In addition to the [common props](#common-props), `Caption` supports:

| Prop | Type | Default | Description |
| - | - | - | - |
| `size` | `sm` \| `md` \| `lg` | `md` | Font size. |
| `weight` | `normal` \| `medium` \| `semibold` \| `bold` | `normal` | Font weight. |

<Info>
  Caption automatically preserves line breaks (`\n`) in the value string, so you can pass multi-line content without additional formatting.
</Info>

***

## Label

A text label designed for form fields. Place it directly above an `Input`, `Select`, or other form control to provide a visible, accessible label.

```jsx theme={null}
<Label value="Email address" fieldName="email" />
<Input name="email" placeholder="you@example.com" />
```

### Props

| Prop | Type | Default | Description |
| - | - | - | - |
| `value` | `string` | — | The label text. |
| `fieldName` | `string` | — | The `name` of the input this label is associated with. |
| `size` | `xs` \| `sm` \| `md` \| `lg` \| `xl` | `md` | Font size. |
| `weight` | `normal` \| `medium` \| `semibold` \| `bold` | — | Font weight. |

<Tip>
  Always set `fieldName` to match the `name` prop of the corresponding input. This links the label to the field for accessibility and click-to-focus behavior.
</Tip>

***

## Markdown

Renders Markdown-formatted text, including headings, lists, links, code blocks, and inline formatting.

```jsx theme={null}
<Markdown value={instructions} />
```

### Props

| Prop | Type | Default | Description |
| - | - | - | - |
| `value` | `string` | — | The Markdown content to render. |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
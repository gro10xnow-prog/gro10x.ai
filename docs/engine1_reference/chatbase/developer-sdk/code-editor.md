> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Code Editor

> Write widget code, define schemas, and preview with examples using the code editor.

The **Code** tab is the manual editor for writing and editing widget code and data. It is split into two sections: the **main editor** (top) where you write the widget's visual layout, and the **footer panel** (bottom) where you define the schema and manage examples.

## Main Editor

The main editor is where you write the widget's visual layout using the built-in component library. It includes:

* **Autocomplete and type hints** for all available components and their properties.
* **Syntax highlighting** for readable, structured code.
* A **Copy button** next to the JSON toggle for quick clipboard access.

<Tip>
  Use autocomplete to discover available components and their supported props without leaving the editor.
</Tip>

## Code Syntax

The code editor uses a JSX-like syntax. Below are the key patterns for working with data in your widget code.

### Variables

Reference data fields using curly braces. Each variable maps to a field defined in the schema.

```jsx theme={null}
<Title value={title} size="sm" />
<Text value={description} size="sm" color="secondary" />
```

### Nested Data

Access nested objects using dot notation.

```jsx theme={null}
<Text value={speaker.name} />
<Text value={speaker.title} />
```

### Loops

Repeat elements over an array using `.map()`.

```jsx theme={null}
{speakers.map((speaker) => (
  <Row key={speaker.id} gap={3}>
    <Image src={speaker.image} />
    <Text value={speaker.name} size="sm" />
  </Row>
))}
```

### String Interpolation

Combine static text with data fields using backticks and `${}` syntax.

```jsx theme={null}
<Text value={`Tax (${taxPercent})`} />
```

## Schema

The **Schema** editor lives in the footer panel. It defines the data fields the AI agent needs to provide when rendering the widget. Schemas are written using **Zod**.

The footer panel includes a **Zod/JSON toggle**:

* **Zod** -- the editable schema definition.
* **JSON Schema** -- a read-only, auto-generated view derived from the Zod schema.

<Info>
  The schema is how the AI agent knows what data to pass into the widget. Each field in the schema maps to a variable you can reference in the code.
</Info>

## Default Example

The **Default** tab in the footer panel contains the initial values for all schema fields. These values are used when the widget first renders in the preview.

```json theme={null}
{
  "title": "Hello World",
  "description": "This is a sample widget"
}
```

## Named Examples

Named examples let you visualize different data scenarios without changing the default values. Use them to test how the widget looks with varying data -- for example, 1 item vs 5 items, or an empty state vs a post-submission state.

<Steps>
  <Step title="Create an example">
    Click the **+** button in the footer panel to add a new named example.
  </Step>

  <Step title="Edit the name and values">
    Each named example has an editable name and its own set of field values.
  </Step>

  <Step title="Switch between examples">
    Click any example tab to update the preview with that example's data.
  </Step>
</Steps>

<Note>
  Named examples are for previewing in the builder only. At runtime, data comes from the action. See the [Overview](/docs/developer-guides/widgets/overview) page for details on data sources.
</Note>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
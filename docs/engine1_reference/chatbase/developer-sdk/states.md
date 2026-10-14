> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# States

> Conditionally show or hide parts of your widget based on data values using states and conditions.

## What are States?

States let you conditionally show or hide parts of your widget based on current data values. Each state has a **name**, a **visibility condition**, and wraps a section of content in the widget code. When a state is active, the content inside it is visible. When inactive, the content is hidden.

## Using States in the Code

To use a state, wrap the components you want to control in a tag that matches the state name. For example, a state named "Loading" wraps content in a `<Loading>` tag:

```jsx theme={null}
<Card size="md">
  <Loading>
    <Text value="Please wait..." />
  </Loading>
  <Title value={title} size="sm" />
  <Text value={description} />
</Card>
```

When the "Loading" state is active, the `<Text value="Please wait..." />` element is visible. The rest of the widget renders normally regardless of the state.

## Multiple Active States

Multiple states can be active at the same time. Each state independently controls the visibility of its own wrapped content.

```jsx theme={null}
<Card size="md">
  <LoggedIn>
    <Text value={`Welcome back, ${userName}`} />
  </LoggedIn>
  <HasItems>
    <Text value={`You have ${itemCount} items in your cart`} />
  </HasItems>
  <Button label="Continue" onClickAction={{ functionName: "next" }} />
</Card>
```

In this example, if both "LoggedIn" and "HasItems" states are active, the user sees the welcome message, the item count, and the button. If only "LoggedIn" is active, the item count is hidden but the welcome message and button still appear.

## Visibility Modes

Each state has a visibility mode that determines when its content is shown.

| Mode | Behavior |
| - | - |
| **Always visible** | The state is always active. Wrapped content is always shown. |
| **Always hidden** | The state is never active. Wrapped content is always hidden. |
| **Conditional** | The state is active only when its configured conditions are met. |

<Tip>
  Use **Always visible** and **Always hidden** modes to quickly toggle sections on and off during development without removing conditions.
</Tip>

## Operators

When using conditional visibility, each condition compares a data field against a value using an operator.

| Operator | Description |
| - | - |
| **equal to** | Exact match against the comparison value. |
| **not equal to** | Does not match the comparison value. |
| **contains** | The field contains the comparison value as a substring. |
| **not contains** | The field does not contain the comparison value as a substring. |
| **greater than** | The field is greater than the comparison value. |
| **less than** | The field is less than the comparison value. |
| **is empty** | The field has no value. No comparison value is needed. |
| **is not empty** | The field has a value. No comparison value is needed. |

## Combining Conditions

You can combine multiple conditions using **AND** and **OR** connectors.

* **AND** — All conditions must be true for the state to be active.
* **OR** — At least one condition must be true for the state to be active.

Each condition after the first specifies its connector to the previous condition. This lets you build expressions like:

> `status` equal to "active" **AND** `role` equal to "admin"

<Info>
  The connector (AND/OR) is set on each condition individually, starting from the second condition onward. The first condition has no connector.
</Info>

## Condition Groups

For more complex logic, you can nest conditions into groups. Each group is evaluated as a unit, and groups are connected to each other with AND or OR.

This lets you express logic like:

> (`status` equal to "active" **AND** `role` equal to "admin") **OR** (`status` equal to "active" **AND** `role` equal to "editor")

In this example, the state is active when the status is "active" and the role is either "admin" or "editor."

## States Tab in the Builder

You manage states from the **States** tab in the widget builder. Each state is displayed as a card with the following controls:

* **Name** — The state name, which must match the tag used in the widget code.
* **Visibility dropdown** — Choose between Always visible, Always hidden, or Conditional.
* **Conditions** — When set to Conditional, configure one or more conditions with fields, operators, values, and connectors.
* **Cancel / Done** — Discard or save your changes to the state.

<Note>
  States are different from **Named Examples**. Named Examples are data presets used for previewing different scenarios in the builder. States control conditional visibility of widget content at runtime based on actual data values.
</Note>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
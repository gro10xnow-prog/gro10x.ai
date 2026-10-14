> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Interactive

> Interactive components for user actions — Button.

## Button

A clickable button that triggers a function when pressed. Buttons are the primary way users interact with your widget, whether submitting forms, navigating between views, or performing actions.

```jsx theme={null}
<Button label="Submit" onClickAction={{ functionName: "submit" }} variant="solid" color="primary" />
```

### Props

| Prop | Type | Default | Description |
| - | - | - | - |
| `label` | string | — | Button text. |
| `onClickAction` | action | — | Function to run when clicked. |
| `variant` | `solid` \| `soft` \| `outline` \| `ghost` | `solid` | Visual style of the button. |
| `color` | `primary` \| `secondary` \| `success` \| `danger` \| `warning` \| `info` \| `discovery` \| `caution` | `secondary` | Button color. |
| `size` | `3xs` \| `2xs` \| `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `2xl` \| `3xl` | `md` | Button size. |
| `iconStart` | icon name | — | Icon displayed before the label. |
| `iconEnd` | icon name | — | Icon displayed after the label. |
| `iconSize` | `sm` \| `md` \| `lg` \| `xl` \| `2xl` | — | Size of the start and end icons. |
| `submit` | boolean | `false` | Submit the parent form when clicked. |
| `block` | boolean | `false` | Stretch the button to full width. |
| `pill` | boolean | `false` | Apply fully rounded corners. |
| `uniform` | boolean | `false` | Equal width and height, creating a square button. |
| `disabled` | boolean | `false` | Disable the button, preventing interaction. |

<Tip>
  The `onClickAction` prop accepts an object with a `functionName` key that maps to one of your widget's defined functions. You can also pass an `additionalInputs` object to send extra data along with the action.
</Tip>

***

### Examples

#### Basic Action Button

A simple button that triggers a named function when clicked.

```jsx theme={null}
<Button
  label="Refresh"
  onClickAction={{ functionName: "refresh" }}
  variant="solid"
  color="primary"
/>
```

#### Form Submit Button

Use the `submit` prop to make the button submit its parent form. Pair this with a `Card` that has `asForm` set to `true`.

```jsx theme={null}
<Card asForm>
  <Col gap={3}>
    <TextInput name="email" label="Email" />
    <Button label="Subscribe" submit variant="solid" color="success" />
  </Col>
</Card>
```

<Info>
  When `submit` is `true`, clicking the button collects all input values from the parent form and passes them to the function defined in the `Card`'s `confirm` action or the button's own `onClickAction`.
</Info>

#### Icon Button

Add icons before or after the label using `iconStart` and `iconEnd`. Use the `uniform` prop to create a square icon-only button.

```jsx theme={null}
<Button
  label="Download"
  onClickAction={{ functionName: "download" }}
  iconStart="arrow-down-to-line"
  variant="outline"
  color="info"
/>
```

```jsx theme={null}
<Button
  label=""
  onClickAction={{ functionName: "settings" }}
  iconStart="gear"
  uniform
  variant="ghost"
/>
```

#### Full-Width Button

Set `block` to `true` to make the button span the entire width of its container.

```jsx theme={null}
<Button
  label="Continue to Checkout"
  onClickAction={{ functionName: "checkout" }}
  variant="solid"
  color="primary"
  block
/>
```

#### Button with Additional Inputs

Pass extra data alongside the action using `additionalInputs`. This is especially useful when rendering buttons in a loop, where each button needs to reference a specific item.

```jsx theme={null}
{items.map((item) => (
  <Button
    label={item.name}
    onClickAction={{
      functionName: "selectItem",
      additionalInputs: { itemId: item.id }
    }}
    variant="outline"
  />
))}
```

<Tip>
  The `additionalInputs` object is merged with any form data when the action is triggered. Use it to attach contextual identifiers like IDs, indexes, or metadata to button clicks.
</Tip>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
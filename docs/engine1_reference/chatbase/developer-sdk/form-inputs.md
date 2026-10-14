> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Form Inputs

> Form and input components for collecting user data — Form, Input, Textarea, Select, DatePicker, Checkbox, RadioGroup, Slider, Dropzone, and FileInput.

## Common Form Input Props

`Input`, `Textarea`, `Select`, `DatePicker`, `Checkbox`, `RadioGroup`, and `Slider` all share the following props for handling form data and interaction.

| Prop | Type | Default | Description |
| - | - | - | - |
| `name` | string | — | Field name used as the key in form submission data. |
| `required` | boolean | `false` | Whether the field must be filled before the form can be submitted. |
| `disabled` | boolean | `false` | Disables the input, preventing user interaction. |
| `onChangeAction` | action | — | Function to run when the value changes. Available on `Select`, `DatePicker`, `Checkbox`, `RadioGroup`, and `Slider` only. |

<Info>
  The `name` prop on a form input automatically creates a variable in the widget's data. For example, an `<Input name="email" />` creates an `email` variable that you can reference elsewhere in the widget using `{email}`, use in template tokens as `{{email}}`, or check in state conditions.
</Info>

<Tip>
  Make sure each `name` is unique within a `Form` to avoid collisions.
</Tip>

***

## Form

A container that groups input components and handles submission. Wrap your inputs inside a `Form` to collect their values together when the user submits.

```jsx theme={null}
<Form onSubmitAction={{ functionName: "submitForm" }}>
  <Input name="email" placeholder="Enter your email" required />
  <Button label="Submit" submit />
</Form>
```

### Props

`Form` accepts all [Box props](/docs/developer-guides/widgets/components/layout#box) plus:

| Prop | Type | Default | Description |
| - | - | - | - |
| `onSubmitAction` | action | — | Function to run when the form is submitted. Receives all field values keyed by `name`. |

<Info>
  Place a `Button` with the `submit` prop inside the `Form` to trigger submission. All inputs within the form will have their values collected automatically.
</Info>

The browser checks every field before `onSubmitAction` runs. A field that fails `required`, `pattern`, `minLength`, `maxLength`, `min` or `max`, or holds an invalid `email`, `url` or `tel` value, stops the submit. So does a `Dropzone` or `FileInput` that is still uploading. Only a `Form` checks its fields. A `Button` with its own `onClickAction` runs it unchecked.

***

## Input

A single-line text input for collecting short-form data like emails, names, or numbers.

```jsx theme={null}
<Input name="email" inputType="email" placeholder="you@example.com" required />
```

### Props

In addition to all [common form input props](#common-form-input-props), `Input` accepts:

| Prop | Type | Default | Description |
| - | - | - | - |
| `inputType` | `text` \| `email` \| `password` \| `number` \| `tel` \| `url` | `text` | The type of data the input accepts. Controls keyboard layout on mobile and browser validation. |
| `placeholder` | string | — | Hint text displayed when the input is empty. |
| `defaultValue` | string | — | Initial value of the input. |
| `variant` | `soft` \| `outline` | `outline` | Visual style of the input. |
| `size` | `3xs` \| `2xs` \| `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `2xl` \| `3xl` | `md` | Controls the overall size of the input. |
| `gutterSize` | `2xs` \| `xs` \| `sm` \| `md` \| `lg` \| `xl` | — | Inner horizontal padding of the input. |
| `pattern` | string | — | A regex pattern the input value must match for validation. |
| `minLength` | number | — | Minimum number of characters. |
| `maxLength` | number | — | Maximum number of characters. |
| `min` | number \| string | — | Lowest value accepted when `inputType` is `number`. |
| `max` | number \| string | — | Highest value accepted when `inputType` is `number`. |
| `pill` | boolean | `false` | Renders the input with fully rounded corners. |
| `autoFocus` | boolean | `false` | Automatically focuses the input when the widget loads. |
| `autoSelect` | boolean | `false` | Selects all text in the input when it receives focus. |
| `allowAutofillExtensions` | boolean | `false` | Allows browser autofill extensions to interact with the input. |

***

## Textarea

A multi-line text input for collecting longer-form content like messages or descriptions.

```jsx theme={null}
<Textarea name="message" placeholder="Type your message..." rows={4} />
```

### Props

In addition to all [common form input props](#common-form-input-props), `Textarea` accepts:

| Prop | Type | Default | Description |
| - | - | - | - |
| `placeholder` | string | — | Hint text displayed when the textarea is empty. |
| `defaultValue` | string | — | Initial value of the textarea. |
| `rows` | number | — | Number of visible text lines. |
| `autoResize` | boolean | `false` | Automatically adjusts the height as the user types. |
| `maxRows` | number | — | Maximum number of rows the textarea can expand to when `autoResize` is enabled. |
| `minLength` | number | — | Minimum number of characters. |
| `maxLength` | number | — | Maximum number of characters. |
| `variant` | `soft` \| `outline` | `outline` | Visual style of the textarea. |
| `size` | `3xs` \| `2xs` \| `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `2xl` \| `3xl` | `md` | Controls the overall size of the textarea. |
| `gutterSize` | `2xs` \| `xs` \| `sm` \| `md` \| `lg` \| `xl` | — | Inner horizontal padding of the textarea. |
| `autoFocus` | boolean | `false` | Automatically focuses the textarea when the widget loads. |
| `autoSelect` | boolean | `false` | Selects all text in the textarea when it receives focus. |
| `allowAutofillExtensions` | boolean | `false` | Allows browser autofill extensions to interact with the textarea. |

***

## Select

A dropdown for choosing one option from a list. Supports search, clearing, and custom option descriptions.

```jsx theme={null}
<Select name="country" placeholder="Choose a country" options={countries} />
```

### Props

In addition to all [common form input props](#common-form-input-props), `Select` accepts:

| Prop | Type | Default | Description |
| - | - | - | - |
| `options` | `{label, value, disabled?, description?}[]` | — | The list of options to display in the dropdown. |
| `placeholder` | string | — | Hint text displayed when no option is selected. |
| `defaultValue` | string | — | The initially selected value. |
| `variant` | `soft` \| `outline` \| `ghost` | `outline` | Visual style. `ghost` renders a minimal, borderless appearance. |
| `size` | `3xs` \| `2xs` \| `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `2xl` \| `3xl` | `md` | Controls the overall size of the select. |
| `block` | boolean | `false` | Makes the select stretch to fill the full width of its container. |
| `pill` | boolean | `false` | Renders the select with fully rounded corners. |
| `clearable` | boolean | `false` | Shows a clear button to reset the selection. |
| `searchable` | boolean | `false` | Enables a search field within the dropdown to filter options. |

<Note>
  Each option in the `options` array requires a `label` (displayed text) and a `value` (submitted data). You can optionally include `disabled` to gray out an option or `description` to show helper text below the label.
</Note>

***

## DatePicker

A calendar-based date selector rendered inside a popover. Use it for collecting dates with optional min/max constraints.

```jsx theme={null}
<DatePicker name="startDate" placeholder="Pick a date" min="2025-01-01" max="2025-12-31" />
```

### Props

In addition to all [common form input props](#common-form-input-props), `DatePicker` accepts:

| Prop | Type | Default | Description |
| - | - | - | - |
| `placeholder` | string | — | Hint text displayed when no date is selected. |
| `defaultValue` | string (`yyyy-MM-dd`) | — | The initially selected date. |
| `min` | string (`yyyy-MM-dd`) | — | The earliest selectable date. |
| `max` | string (`yyyy-MM-dd`) | — | The latest selectable date. |
| `variant` | `soft` \| `outline` \| `ghost` | `outline` | Visual style. `ghost` shows a compact, minimal format. |
| `size` | `3xs` \| `2xs` \| `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `2xl` \| `3xl` | `md` | Controls the overall size of the date picker trigger. |
| `side` | `top` \| `bottom` \| `left` \| `right` | — | Preferred side for the calendar popover to open. |
| `align` | `start` \| `center` \| `end` | — | Alignment of the calendar popover relative to the trigger. |
| `block` | boolean | `false` | Makes the date picker stretch to fill the full width of its container. |
| `pill` | boolean | `false` | Renders the trigger with fully rounded corners. |
| `clearable` | boolean | `false` | Shows a clear button to reset the selected date. |

***

## Checkbox

A single toggle for boolean choices, rendered with an accompanying label.

```jsx theme={null}
<Checkbox name="agree" label="I agree to the terms" />
```

### Props

In addition to all [common form input props](#common-form-input-props), `Checkbox` accepts:

| Prop | Type | Default | Description |
| - | - | - | - |
| `label` | string | — | Text displayed next to the checkbox. |
| `defaultChecked` | boolean \| string | `false` | Whether the checkbox is initially checked. |

***

## RadioGroup

A group of radio buttons for selecting exactly one option from a set. Supports horizontal or vertical layout.

```jsx theme={null}
<RadioGroup name="plan" options={[
  { label: "Free", value: "free" },
  { label: "Pro", value: "pro" }
]} defaultValue="free" direction="col" />
```

### Props

In addition to all [common form input props](#common-form-input-props), `RadioGroup` accepts:

| Prop | Type | Default | Description |
| - | - | - | - |
| `options` | `{label, value, disabled?}[]` | — | The list of radio options to display. |
| `defaultValue` | string | — | The initially selected value. |
| `direction` | `col` \| `row` | `row` | Controls whether options are stacked vertically or laid out horizontally. |
| `ariaLabel` | string | — | Accessible label for the radio group, used by screen readers. |

***

## Slider

A draggable slider for picking a numeric value between a minimum and maximum — quantities, ratings, budgets, or parameter adjustment. The value is submitted as a number.

```jsx theme={null}
<Slider
  name="budget"
  min={0}
  max={500}
  step={10}
  defaultValue={100}
  label="Budget"
  showValue
  minLabel="$0"
  maxLabel="$500"
/>
```

### Props

In addition to all [common form input props](#common-form-input-props), `Slider` accepts:

| Prop | Type | Default | Description |
| - | - | - | - |
| `min` | number | `0` | The lowest selectable value. |
| `max` | number | `100` | The highest selectable value. |
| `step` | number | `1` | The increment between selectable values. |
| `defaultValue` | number | `min` | The initially selected value. Clamped into the `min`–`max` range. |
| `label` | string | — | Label displayed above the slider track. |
| `showValue` | boolean | `false` | Shows the live value to the right of the label, updating as the user drags. |
| `minLabel` | string | — | Small caption displayed under the left end of the track. |
| `maxLabel` | string | — | Small caption displayed under the right end of the track. |
| `block` | boolean | `true` | Makes the slider stretch to fill the full width of its container. Set `block={false}` to opt out. |
| `width` | number \| string | — | Explicit width for the slider. Takes precedence over `block`. |

<Tip>
  `onChangeAction` fires once when the user releases the thumb (or finishes a keyboard adjustment), not on every tick while dragging — so it's safe to wire it to a server function. The current value is always available in the widget's data under the slider's `name`.
</Tip>

***

## Dropzone

A drag-and-drop area for uploading files. Files start uploading the moment they are dropped or picked, and a list under the area shows each file's progress, success or error, with retry and remove controls. Requires an [Upload File Function](/docs/developer-guides/widgets/functions#function-types). See the [File Uploads](/docs/developer-guides/widgets/file-uploads) guide.

```jsx theme={null}
<Dropzone
  name="photos"
  uploadAction={{ functionName: "uploadPhoto" }}
  title="Drop your photos here"
/>
```

### Props

| Prop | Type | Default | Description |
| - | - | - | - |
| `name` | string | — | Variable that holds the list of file records. |
| `uploadAction` | action | — | The Upload File Function to run. Required. |
| `autoUpload` | boolean | `true` | Upload as soon as files are added. Set `false` to stage files until a `Button` or `Form` pointing at the same function uploads them. |
| `title` | string | `Click or drag files to upload` | Heading text inside the area. Changes to `Drop the files here` while dragging. |
| `description` | string | derived | Helper text under the heading. Defaults to the function's limits, for example `Up to 10 MB · PDF, PNG`. |
| `icon` | icon name | upload icon | Icon shown in the badge above the heading. |
| `showFiles` | boolean | `true` | Show the file list under the area. |
| `required` | boolean | `false` | The form does not submit until the field holds a file. A failed upload does not count. |
| `disabled` | boolean | `false` | Prevents dropping and picking. |
| `block` | boolean | `true` | Stretch to the container's full width. |
| `width` | number \| string | — | Explicit width. Takes precedence over `block`. |

<Info>
  The `name` variable is an array of file records: `{ name, size, type, status, url, error, response }`, where `status` is `staged`, `uploading`, `success` or `error`. Use `{photos[0].url}` in the code or `{{photos[0].url}}` in template tokens once a file has uploaded.
</Info>

***

## FileInput

A button-styled file picker for compact layouts. It behaves like `Dropzone` without the drop area, and shares the same file list, limits and function.

```jsx theme={null}
<FileInput
  name="avatar"
  label="Choose photo"
  uploadAction={{ functionName: "uploadAvatar" }}
/>
```

### Props

| Prop | Type | Default | Description |
| - | - | - | - |
| `name` | string | — | Variable that holds the list of file records. |
| `uploadAction` | action | — | The Upload File Function to run. Required. |
| `autoUpload` | boolean | `true` | Upload as soon as files are picked. Set `false` to stage them for a `Button` or `Form`. |
| `label` | string | `Choose file` | Button text. |
| `iconStart` | icon name | paperclip | Icon displayed before the label. |
| `color` | `primary` \| `secondary` \| `success` \| `danger` \| `warning` \| `info` \| `discovery` \| `caution` | `secondary` | Button color. |
| `variant` | `solid` \| `soft` \| `outline` \| `ghost` | `outline` | Visual style. |
| `size` | `3xs` \| `2xs` \| `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `2xl` \| `3xl` | `md` | Button size. |
| `pill` | boolean | `true` | Apply fully rounded corners. |
| `showFiles` | boolean | `true` | Show the file list under the button. |
| `required` | boolean | `false` | The form does not submit until the field holds a file. A failed upload does not count. |
| `disabled` | boolean | `false` | Disable the picker. |
| `block` | boolean | `false` | Stretch to the container's full width. |
| `width` | number \| string | — | Explicit width. Takes precedence over `block`. |

<Tip>
  While a file is uploading, both components stop accepting new files, the `FileInput` button shows a spinner, and a `Form` around them does not submit until it finishes. Whether a second file replaces the first or is added alongside it depends on the function's **Allow multiple files** setting.
</Tip>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
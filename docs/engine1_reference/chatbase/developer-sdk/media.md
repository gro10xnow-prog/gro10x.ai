> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Media & Visual

> Visual components for icons, images, badges, and animations.

## Icon

Displays an icon from the [Lucide](https://lucide.dev/icons) icon library. All \~1,600+ Lucide icons are supported, referenced by their kebab-case name. Use icons to add visual context to labels, buttons, cards, and other elements.

```jsx theme={null}
<Icon name="map-pin" size="xl" color="primary" />
```

### Props

| Prop | Type | Default | Description |
| :- | :- | :- | :- |
| **name** | `string` | — | The icon to display. Accepts any [Lucide icon name](https://lucide.dev/icons) in kebab-case (e.g. `"heart"`, `"calendar-days"`, `"arrow-right"`) or a [custom alias](#custom-icon-aliases). |
| **size** | `"xs"` \| `"sm"` \| `"md"` \| `"lg"` \| `"xl"` \| `"2xl"` \| `"3xl"` | `"md"` | Controls the rendered size of the icon. |
| **stroke** | `number` | `2` | Stroke width of the icon. |
| **fill** | `string` | `"transparent"` | Fill color of the icon. Use `"currentColor"` for a filled appearance. |
| **color** | `string` | — | Sets the icon color. Accepts theme tokens like `primary`, `secondary`, `success`, `danger`, etc. |

### Icon field format

When specifying an icon in component props that accept an icon value, you can use either format:

* **A plain string** -- just the icon name:
  ```json theme={null}
  "heart"
  ```
* **An object** -- with optional styling overrides:
  ```json theme={null}
  { "name": "heart", "stroke": 1.5, "fill": "currentColor" }
  ```

### Custom icon aliases

In addition to the full Lucide set, the following semantic aliases are available for convenience:

| Alias | Lucide Icon |
| :- | :- |
| `agent` | `bot` |
| `analytics` | `chart-bar` |
| `batch` | `layers` |
| `bolt` | `zap` |
| `book-clock` | `book-marked` |
| `check-circle-filled` | `circle-check` |
| `circle-question` | `circle-help` |
| `confetti` | `party-popper` |
| `lifesaver` | `life-buoy` |
| `maps` | `map` |
| `mobile` | `smartphone` |
| `name` | `user` |
| `notebook-pencil` | `notebook-pen` |
| `page-blank` | `file` |
| `profile` | `user` |
| `profile-card` | `id-card` |
| `reload` | `refresh-cw` |
| `settings-slider` | `sliders-horizontal` |
| `sparkle-double` | `sparkles` |
| `sparkle` | `sparkles` |
| `square-code` | `code` |
| `square-image` | `image` |
| `square-text` | `text` |
| `star-filled` | `star` |
| `suitcase` | `briefcase` |
| `wreath` | `award` |
| `write` | `pencil` |
| `write-alt` | `pen-tool` |
| `write-alt2` | `square-pen` |
| `close` | `x` |
| `add` | `plus` |
| `remove` | `minus` |
| `delete` | `trash-2` |
| `edit` | `pencil` |
| `success` | `circle-check` |
| `error` | `circle-x` |
| `warning` | `triangle-alert` |
| `caution` | `triangle-alert` |
| `danger` | `octagon-alert` |
| `discovery` | `sparkles` |
| `back` | `arrow-left` |
| `forward` | `arrow-right` |
| `up` | `arrow-up` |
| `down` | `arrow-down` |
| `stop` | `square` |
| `paste` | `clipboard` |
| `attachment` | `paperclip` |
| `external` | `external-link` |
| `rain` | `cloud-rain` |
| `snow` | `snowflake` |
| `arrow-down-az` | `arrow-down-az` |
| `arrow-down-za` | `arrow-down-za` |
| `arrow-up-az` | `arrow-up-az` |
| `arrow-up-za` | `arrow-up-za` |

<Tip>
  Browse the full icon set at [lucide.dev/icons](https://lucide.dev/icons). Any icon listed there can be used by its kebab-case name.
</Tip>

***

## Image

Displays an image with flexible sizing, fitting, and theme-aware source support.

```jsx theme={null}
<Image src={productImage} width={120} height={120} radius="md" fit="cover" />
```

You can also provide separate images for light and dark themes:

```jsx theme={null}
<Image
  src={{ light: lightLogo, dark: darkLogo }}
  width={200}
  height={60}
  fit="contain"
/>
```

### Props

| Prop | Type | Default | Description |
| :- | :- | :- | :- |
| **src** | `string` \| `{ light: string, dark: string }` | — | Image source URL. Pass an object with `light` and `dark` keys to display different images based on the active theme. |
| **alt** | `string` | — | Alternative text for accessibility. |
| **size** | `number` | — | Square shorthand — sets both `width` and `height` to the same value. |
| **width** | `number` | — | Image width in pixels. |
| **height** | `number` | — | Image height in pixels. |
| **minWidth** | `number` | — | Minimum width constraint. |
| **maxWidth** | `number` | — | Maximum width constraint. |
| **minHeight** | `number` | — | Minimum height constraint. |
| **maxHeight** | `number` | — | Maximum height constraint. |
| **minSize** | `number` | — | Minimum size shorthand (applies to both dimensions). |
| **maxSize** | `number` | — | Maximum size shorthand (applies to both dimensions). |
| **aspectRatio** | `number` | — | Aspect ratio for the image container (e.g., `16/9`). |
| **radius** | `string` | — | Border radius token (e.g., `"sm"`, `"md"`, `"lg"`, `"full"`). |
| **background** | `string` | — | Background color behind the image. |
| **flex** | `number` | — | Flex grow/shrink value for layout sizing. |
| **fit** | `"cover"` \| `"contain"` \| `"fill"` \| `"scale-down"` \| `"none"` | — | How the image fills its container, matching the CSS `object-fit` property. |
| **position** | `"center"` \| `"top"` \| `"bottom"` \| `"left"` \| `"right"` \| `"top left"` \| `"top right"` \| `"bottom left"` \| `"bottom right"` | `"center"` | Alignment of the image within its container when `fit` causes cropping. |
| **frame** | `boolean` | — | When `true`, wraps the image in a subtle border frame. |
| **flush** | `boolean` | — | When `true`, removes default padding around the image. |
| **onClickAction** | `string` | — | Function name to invoke when the image is clicked. |

<Info>
  Use `fit="cover"` with a fixed `width` and `height` to crop images into consistent thumbnails. Use `fit="contain"` when you need to show the full image without cropping.
</Info>

***

## Badge

A small label used to indicate status, categories, or tags.

```jsx theme={null}
<Badge label="Active" color="success" variant="soft" />
```

```jsx theme={null}
<Badge label="Overdue" color="danger" variant="solid" pill />
```

### Props

| Prop | Type | Default | Description |
| :- | :- | :- | :- |
| **label** | `string` | — | The text displayed inside the badge. |
| **color** | `"secondary"` \| `"success"` \| `"danger"` \| `"warning"` \| `"info"` \| `"discovery"` | `"secondary"` | Semantic color of the badge. |
| **variant** | `"solid"` \| `"soft"` \| `"outline"` | `"soft"` | Visual style. `solid` uses a filled background, `soft` uses a tinted background, and `outline` shows only a border. |
| **size** | `"sm"` \| `"md"` \| `"lg"` | `"sm"` | Controls the size of the badge. |
| **pill** | `boolean` | — | When `true`, applies fully rounded corners for a pill shape. |

<Tip>
  Combine badges with layout components to build tag lists or status indicators inside cards and tables.
</Tip>

***

## Transition

Wraps a child element with a fade-in and fade-out animation. Use this to add polish when content appears or disappears — for example, when toggling visibility with states.

```jsx theme={null}
<Transition>
  <Text value="This fades in" />
</Transition>
```

The animation applies a 0.2-second fade with a slight vertical slide. There are no configurable props — simply wrap any element to enable the effect.

<Info>
  Transition works well with [States](/docs/developer-guides/widgets/states) to animate content that conditionally appears based on user input or data changes.
</Info>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
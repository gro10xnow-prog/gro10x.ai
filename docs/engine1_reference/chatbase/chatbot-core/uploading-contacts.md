> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Uploading Contacts

Bulk contact import lets you upload multiple contacts at once through a guided import flow in your AI agent’s **Contacts** page.

You can use this to:

* Quickly add new contacts
* Update existing contacts by External ID
* Import custom attributes in bulk

***

## Import contacts

The import flow consists of four steps.

### Upload file

Upload a `.csv` or `.xlsx` file by dragging it into the upload area or clicking to select a file.

> **Limits**
>
> * Maximum file size: **5 MB**
> * Maximum rows per upload: **1,000**

You can also download a CSV template with the correct headers.

The template includes:

* Standard contact fields
* Any custom attributes defined for the AI agent

***

### Map columns

After uploading your file, Chatbase automatically matches your file headers to contact fields.

Supported fields include:

* External ID
* Name
* Email
* Phone
* Custom attributes

You can manually adjust mappings using the dropdown menus.

> **Important**
>
> External ID is required. You must map a column to **External ID** before continuing.

#### Mapping rules

* Each CSV header can only be mapped to one field
* Custom attributes appear automatically during mapping
* Unmapped columns are ignored during import

***

### Review and confirm

Before importing, Chatbase displays a paginated preview table with all mapped rows.

Each row is validated against existing contacts and duplicate values.

#### Duplicate handling

| Condition | Result |
| - | - |
| Duplicate External ID in the file | Row is blocked |
| Duplicate email or phone in the file | Row is blocked |
| Email or phone already exists in another contact | Row is blocked |
| External ID already exists | Row is marked as **Update** to update the existing contact |
| Missing External ID | Row is automatically excluded |

Rows marked as **Update** will update the existing contact with the same External ID.

You can hover over warning icons or the **Update** badge to see more details, including which fields will change.

> **Note**
>
> Phone numbers are normalized to E.164 format before duplicate checks are performed.

#### Row selection

You can:

* Select individual rows
* Deselect rows you do not want to import
* Use the **Select all** checkbox

***

### Completing the Import

After the import completes, Chatbase displays the import results.

This includes:

* Number of successful imports
* Number of failed rows
* Detailed error messages for failed rows

Example error:

```text theme={null}
A contact with this email already exists
```

You can retry failed rows or close the dialog.

***

## Add a single contact

Contacts can also be added individually.

Go to:

```text theme={null}
Dashboard → AI Agent → Contacts → Add Contact
```

The form includes:

* External ID
* Name
* Email
* Phone
* Any Custom attributes

> **Important**
>
> External ID is required when creating a contact manually.

***

## Delete contacts

Contacts are deleted from the **Contacts** page in the dashboard. There is no cap on how many you can remove at once.

<Steps>
  <Step title="Select the contacts">
    Tick individual rows, or use the checkbox in the table header to select every contact on the current page. A banner then confirms what you have, such as **All 20 contacts on this page are selected**, next to a **Select all N contacts** button that widens the selection to every contact across every page.
  </Step>

  <Step title="Delete them">
    A toolbar appears at the bottom of the page with the number of contacts selected and a **Delete** button. The **×** beside it clears the selection without deleting anything.
  </Step>
</Steps>

<Tip>
  **Rows per page**, at the bottom left of the table, sets how many contacts are shown at a time, which is also how many the header checkbox covers. Raise it to select more per page, or use **Select all N contacts** to ignore paging entirely.
</Tip>

<Warning>
  Deleting a contact is permanent. There is no undo, so export anything you need to keep before clearing the list.
</Warning>

***

## Custom attributes

Custom attributes allow you to store additional information about contacts.

Manage them from:

```text theme={null}
Contacts → Manage Attributes
```

### Supported attribute types

* Text
* Number
* Boolean
* Date

### Behavior

* Custom attributes appear during import mapping
* Custom attributes appear in the contacts table
* Archived attributes are hidden from forms
* Archived attribute data is preserved


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
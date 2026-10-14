> ## Documentation Index
> Fetch the complete documentation index at: https://chatbase.co/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Identity Verification

> Authenticate users in your AI Agent widget just like they're authenticated on your website.

Identity verification allows you to securely authenticate your users in your AI Agent widget. When an end user is logged into your website, you can identify them to your AI Agent so the widget knows who they are and can provide personalized, authenticated experiences.

Chatbase AI agents can be configured to verify the identity of your users. This can be done with a JWT or by hashing the User ID. You
can also send additional metadata to the AI agent that can be used to personalize the AI agent experience.

## When to Use Identity Verification

<AccordionGroup>
  <Accordion title="Personalize the Chat Experience">
    Make your AI Agent recognize logged-in users so it can:

    * Greet users by name instead of saying "Hello there"
    * Access their account information and preferences
    * Show content relevant to their subscription or role
    * Provide support based on their history with your service
  </Accordion>

  <Accordion title="Enable Actions with User Data">
    When you need actions that require specific user information from their contact record:

    * Custom actions that need to access user details (name, email, subscription info, etc.)
    * Stripe actions (billing, subscriptions, invoices) [Learn more about Stripe actions](/docs/user-guides/chatbot/actions/stripe-action).

    <Note>
      These actions work by matching the authenticated user's ID with a Contact record that contains their detailed information.
    </Note>
  </Accordion>

  <Accordion title="Sync Contacts with the AI Agent">
    By sending user contact information in the JWT, you can always keep contact information up to date instead of sending contact information separately via the API.
  </Accordion>
</AccordionGroup>

## Implementation Guide

### Prerequisites

<Info>
  A website with the Chatbase embed script already installed and working.
  New to Chatbase? Check out [Your First AI Agent](/docs/user-guides/quick-start/your-first-agent) to get started with the embed script first.
</Info>

### Get Your Secret Key

Navigate to your Chatbase Dashboard to get your verification secret:

<Steps>
  <Step title="Open Your AI Agent">
    Go to [Chatbase Dashboard](https://www.chatbase.co/dashboard) and select your AI Agent.
  </Step>

  <Step title="Access Embed Settings">
    Navigate to **Channels** → click **Manage** on the **Chat bubble** card → click **Deploy** (top-right) → **Website widget**.
  </Step>

  <Step title="Copy Secret Key">
    Copy the verification secret key shown in the embed code section.

    <Frame>
      <img src="https://mintcdn.com/chatbase/43L6aIC5dZ193e0q/developer-guides/images/identity-verification/deploy-get-secret-key.png?fit=max&auto=format&n=43L6aIC5dZ193e0q&q=85&s=59386d0b7ae010e91e2a407ae3420782" alt="Chatbase embed code with identity verification secret" width="2906" height="1560" data-path="developer-guides/images/identity-verification/deploy-get-secret-key.png" />
    </Frame>
  </Step>
</Steps>

## Method 1: JWT (Recommended)

#### JWT Overview

With a JSON Web Token (JWT), you can securely pass a contact's information to Chatbase. This process, known as identification, serves two purposes: it **identifies the user** to the AI agent and **updates the contact's information** in Chatbase.

#### Generating the JWT Payload

The payload of the JWT contains the sensitive information you want to pass. When you provide contact details like email, name, or Stripe information, Chatbase will use it to update or create the user's contact profile.

<Note>The only required field in the JWT payload is `user_id` or `sub`. All other fields are optional.</Note>

<CodeGroup>
  ```javascript Node.js theme={null}
  const jwt = require("jsonwebtoken");

  // Run this on your server and send the returned token to your frontend.
  function generateChatbaseToken(user) {
      // Secret key from the Chatbase dashboard. Read it from an environment
      const secret = process.env.CHATBASE_SECRET;

      // The payload contains all the user information you want to pass.
      const payload = {
          user_id: user.id, // A unique identifier for the user (required), e.g. "user_12345"
          email: user.email, // User's email address
          name: user.name, // User's full name
          phonenumber: user.phone, // User's phone number, e.g. "+15551234567"
          custom_attributes: { "plan": user.plan }, // Custom attributes defined in your contacts schema
          stripe_accounts: [{ "label": "Default Account", "stripe_id": user.stripeCustomerId }], // Stripe information for integration
          exp: Math.floor(Date.now() / 1000) + (60 * 60) // Token expiration time (e.g., 1 hour from now)
      };

      // Sign the token with the HS256 algorithm and return it
      return jwt.sign(payload, secret, { algorithm: 'HS256' });
  }
  ```

  ```python Python theme={null}
  import jwt
  import os
  import time

  # Run this on your server and send the returned token to your frontend.
  def generate_chatbase_token(user):
      # Secret key from the Chatbase dashboard. Read it from an environment
      secret = os.getenv('CHATBASE_SECRET')

      # The payload contains all the user information you want to pass.
      payload = {
          "user_id": user["id"],  # A unique identifier for the user (required), e.g. "user_12345"
          "email": user["email"],  # User's email address
          "name": user["name"],  # User's full name
          "phonenumber": user["phone"],  # User's phone number, e.g. "+15551234567"
          "custom_attributes": {"plan": user["plan"]},  # Custom attributes defined in your contacts schema
          "stripe_accounts": [{"label": "Default Account", "stripe_id": user["stripe_customer_id"]}],  # Stripe information for integration
          "exp": int(time.time()) + (60 * 60)  # Token expiration time (e.g., 1 hour from now)
      }

      # Sign the token with the HS256 algorithm and return it
      return jwt.encode(payload, secret, algorithm='HS256')
  ```

  ```php PHP theme={null}
  <?php
  use Firebase\JWT\JWT;

  // Run this on your server and send the returned token to your frontend.
  function generateChatbaseToken($user) {
      // Secret key from the Chatbase dashboard. Read it from an environment
      $secret = $_ENV['CHATBASE_SECRET'];

      // The payload contains all the user information you want to pass.
      $payload = [
          'user_id' => $user['id'], // A unique identifier for the user (required), e.g. "user_12345"
          'email' => $user['email'], // User's email address
          'name' => $user['name'], // User's full name
          'phonenumber' => $user['phone'], // User's phone number, e.g. "+15551234567"
          'custom_attributes' => ['plan' => $user['plan']], // Custom attributes defined in your contacts schema
          'stripe_accounts' => [['label' => 'Default Account', 'stripe_id' => $user['stripe_customer_id']]], // Stripe information for integration
          'exp' => time() + (60 * 60) // Token expiration time (e.g., 1 hour from now)
      ];

      // Sign the token with the HS256 algorithm and return it
      return JWT::encode($payload, $secret, 'HS256');
  }
  ?>
  ```

  ```ruby Ruby theme={null}
  require 'jwt'

  # Run this on your server and send the returned token to your frontend.
  def generate_chatbase_token(user)
    # Secret key from the Chatbase dashboard. Read it from an environment
    secret = ENV['CHATBASE_SECRET']

    # The payload contains all the user information you want to pass.
    payload = {
      user_id: user[:id], # A unique identifier for the user (required), e.g. "user_12345"
      email: user[:email], # User's email address
      name: user[:name], # User's full name
      phonenumber: user[:phone], # User's phone number, e.g. "+15551234567"
      custom_attributes: { "plan" => user[:plan] }, # Custom attributes defined in your contacts schema
      stripe_accounts: [{ "label" => "Default Account", "stripe_id" => user[:stripe_customer_id] }], # Stripe information for integration
      exp: Time.now.to_i + (60 * 60) # Token expiration time (e.g., 1 hour from now)
    }

    # Sign the token with the HS256 algorithm and return it
    JWT.encode(payload, secret, 'HS256')
  end
  ```
</CodeGroup>

<Tip>
  For a complete end-to-end example — a login endpoint that returns this token, plus the frontend code that consumes it — see [Complete JWT Implementation Flow](#complete-jwt-implementation-flow).
</Tip>

#### Identifying the User

Once you have the signed JWT on your frontend, you can identify the user to your AI Agent in two ways:

<Tabs>
  <Tab title="Embed script identify method (Recommended)">
    **Dynamically identify end users**

    Data in the token (such as stripe IDs or dates of birth) are not visible to the AI agent to maintain privacy. However, the AI agent can use them to perform actions with your configured integrations. They are passed securely to maintain privacy.

    ```javascript theme={null}
    // Get the signed JWT from your server
    const token = await getJWTFromBackend(); 

    // After end user logs in or when you have their information
    window.chatbase("identify", {
    	// The token contains sensitive data which is protected.
    	token: token,
    	
    	// These public attributes ARE visible to the Chatbot context.
    	"name": user.firstName,
    	"age": user.age
    });
    ```

    This call identifies the user to the AI agent and syncs their contact information.
  </Tab>

  <Tab title="Embed Configuration">
    **Set end user identity before the Chatbase script loads**

    ```html theme={null}
    <script>
    // Get the signed JWT from your server
    const token = await getJWTFromBackend();

    // Set end user configuration before Chatbase script loads
    window.chatbaseUserConfig = {
      token: token,
      "name": user.firstName,
      "age": user.age
    }
    </script>

    <!-- Your normal Chatbase embed script -->
    ```
  </Tab>
</Tabs>

<Warning>
  Attributes passed outside of the JWT are visible to the AI agent. To protect user privacy, never include sensitive information outside of the token.
</Warning>

<Tip>
  Want links your AI agent shares to keep a visitor's campaign attribution? See [UTM Tracking](/docs/developer-guides/utm-tracking) to pass UTM parameters as public attributes.
</Tip>

#### Logging out Users

When a user logs out, call the `resetUser` method to clear their identity from the AI agent session:

```javascript theme={null}
// When the user logs out
window.chatbase("resetUser");
```

#### How Contact Updates Work

* **Adding/Updating Fields:** New fields will be added, and existing ones will be updated.
  ```javascript theme={null}
  // This payload will add or update the user's Stripe information.
  const jwt_payload = {
      user_id: 123,
      stripe_accounts: [{ "label": "account1", "stripe_id": "cust123" }]
  };
  ```

* **Ignoring Fields:** If you don't include a field in the payload, it will be ignored, and the existing value will be preserved.
  ```javascript theme={null}
  // This payload will not change the user's existing Stripe information.
  const jwt_payload = {
      user_id: 123 
  };
  ```

* **Deleting Fields:** To delete a field, pass `null` as its value.
  ```javascript theme={null}
  // This payload will delete the user's Stripe information.
  const jwt_payload = {
      user_id: 123,
      stripe_accounts: null 
  };
  ```

## Complete JWT Implementation Flow

This example shows the complete JWT flow: generating JWT tokens with user data, then using identity verification to enable personalized AI responses and automatic contact updates.

### Step 1: Generate JWT Token on User Login

When users log in, generate a JWT token on your server with their contact information:

<CodeGroup>
  ```javascript Node.js theme={null}
  const jwt = require("jsonwebtoken");

  // Login endpoint
  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    // Authenticate user with your existing logic
    const user = await authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create JWT payload with user information
    const payload = {
      user_id: user.id,                    // Required: unique user identifier.
      email: user.email,                   // User's email
      name: user.name,                     // User's full name
      phonenumber: user.phone,            // User's phone number
      stripe_accounts: [                    // Stripe integration
        {
          "label": "Default Account",
          "stripe_id": user.stripe_customer_id
        }
      ],
      custom_attributes: {                 // Custom user data
        "signup_date": user.signup_date,
        "support_tier": user.support_tier,
        "company": user.company
      },
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
    };
    
    // Sign the JWT with your Chatbase secret
    const token = jwt.sign(payload, process.env.CHATBASE_SECRET, { algorithm: 'HS256' });
    
    res.json({
      user: user,
      token: token  // Send JWT to frontend
    });
  });
  ```

  ```python Python theme={null}
  import jwt
  import time
  from datetime import datetime, timedelta

  # Login endpoint
  @app.route('/api/login', methods=['POST'])
  def login():
      data = request.get_json()
      email = data.get('email')
      password = data.get('password')
      
      # Authenticate user with your existing logic
      user = authenticate_user(email, password)
      if not user:
          return jsonify({'error': 'Invalid credentials'}), 401
      
      # Create JWT payload with user information
      payload = {
          'user_id': user.id,                    # Required: unique user identifier
          'email': user.email,                   # User's email
          'name': user.name,                     # User's full name
          'phonenumber': user.phone,            # User's phone number
          'stripe_accounts': [                   # Stripe integration
              {
                  "label": "Default Account",
                  "stripe_id": user.stripe_customer_id
              }
          ],
          'custom_attributes': {                # Custom user data
              "signup_date": user.signup_date,
              "support_tier": user.support_tier,
              "company": user.company
          },
          'exp': int(time.time()) + (60 * 60)    # 1 hour expiration
      }
      
      # Sign the JWT with your Chatbase secret
      token = jwt.encode(payload, os.getenv('CHATBASE_SECRET'), algorithm='HS256')
      
      return jsonify({
          'user': user,
          'token': token  # Send JWT to frontend
      })
  ```

  ```php PHP theme={null}
  <?php
  use Firebase\JWT\JWT;

  // Login endpoint
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
      $data = json_decode(file_get_contents('php://input'), true);
      $email = $data['email'];
      $password = $data['password'];
      
      // Authenticate user with your existing logic
      $user = authenticateUser($email, $password);
      if (!$user) {
          http_response_code(401);
          echo json_encode(['error' => 'Invalid credentials']);
          exit;
      }
      
      // Create JWT payload with user information
      $payload = [
          'user_id' => $user['id'],                    // Required: unique user identifier
          'email' => $user['email'],                  // User's email
          'name' => $user['name'],                    // User's full name
          'phonenumber' => $user['phone'],           // User's phone number
          'stripe_accounts' => [                      // Stripe integration
              [
                  "label" => "Default Account",
                  "stripe_id" => $user['stripe_customer_id']
              ]
          ],
          'custom_attributes' => [                    // Custom user data
              "signup_date" => $user['signup_date'],
              "support_tier" => $user['support_tier'],
              "company" => $user['company']
          ],
          'exp' => time() + (60 * 60)                // 1 hour expiration
      ];
      
      // Sign the JWT with your Chatbase secret
      $token = JWT::encode($payload, $_ENV['CHATBASE_SECRET'], 'HS256');
      
      echo json_encode([
          'user' => $user,
          'token' => $token  // Send JWT to frontend
      ]);
  }
  ?>
  ```

  ```ruby Ruby theme={null}
  require 'jwt'

  # Login endpoint
  post '/api/login' do
    data = JSON.parse(request.body.read)
    email = data['email']
    password = data['password']
    
    # Authenticate user with your existing logic
    user = authenticate_user(email, password)
    if !user
      status 401
      return { error: 'Invalid credentials' }.to_json
    end
    
    # Create JWT payload with user information
    payload = {
      user_id: user.id,                    # Required: unique user identifier
      email: user.email,                   # User's email
      name: user.name,                     # User's full name
      phonenumber: user.phone,            # User's phone number
      stripe_accounts: [                   # Stripe integration
        {
          "label" => "Default Account",
          "stripe_id" => user.stripe_customer_id
        }
      ],
      custom_attributes: {                # Custom user data
        "signup_date" => user.signup_date,
        "support_tier" => user.support_tier,
        "company" => user.company
      },
      exp: Time.now.to_i + (60 * 60)      # 1 hour expiration
    }
    
    # Sign the JWT with your Chatbase secret
    token = JWT.encode(payload, ENV['CHATBASE_SECRET'], 'HS256')
    
    {
      user: user,
      token: token  # Send JWT to frontend
    }.to_json
  end
  ```
</CodeGroup>

### Step 2: Identify User in Frontend

Use the JWT token to identify the user to Chatbase widget:

```javascript Frontend JWT Identity Verification theme={null}
// After successful login
async function loginUser() {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com', password: 'password' })
  });
  
  const { user, token } = await response.json();
  
  // Identify user to Chatbase and also update/insert this contact
  window.chatbase("identify", {
    token: token,  // JWT contains all user data
    name: user.name // public metadata sent to the chatbot
  });
}
```

***

## Method 2: User Hash (deprecated)

<Warning>Using user hash is not recommended as JWT offers better security and lessens the need to update contacts via API</Warning>

### Generate End User Hash on Your Server

<Warning>
  **Security Critical:** End user hashes must be generated on your server, never in client-side JavaScript, to keep your secret key secure.
</Warning>

<CodeGroup>
  ```javascript Node.js theme={null}
  const crypto = require('crypto');

  // Run this on your server and send the returned hash to your frontend.
  function generateChatbaseUserHash(userId) {
      // Your verification secret key. Read it from an environment variable —
      // never hardcode it or expose it to the browser.
      const secret = process.env.CHATBASE_SECRET;

      // userId is a string UUID that identifies your user
      return crypto.createHmac('sha256', secret).update(userId).digest('hex');
  }
  ```

  ```python Python theme={null}
  import hmac
  import hashlib
  import os

  # Run this on your server and send the returned hash to your frontend.
  def generate_chatbase_user_hash(user_id):
      # Your verification secret key. Read it from an environment variable —
      # never hardcode it or expose it to the browser.
      secret = os.getenv('CHATBASE_SECRET')

      # user_id is a string UUID that identifies your user. You can also use 'sub' instead of 'user_id'
      return hmac.new(secret.encode('utf-8'), user_id.encode('utf-8'), hashlib.sha256).hexdigest()
  ```

  ```php PHP theme={null}
  <?php
  // Run this on your server and send the returned hash to your frontend.
  function generateChatbaseUserHash($userId) {
      // Your verification secret key. Read it from an environment variable —
      // never hardcode it or expose it to the browser.
      $secret = $_ENV['CHATBASE_SECRET'];

      // $userId is a string UUID that identifies your user
      return hash_hmac('sha256', $userId, $secret);
  }
  ?>
  ```

  ```ruby Ruby theme={null}
  require 'openssl'

  # Run this on your server and send the returned hash to your frontend.
  def generate_chatbase_user_hash(user_id)
    # Your verification secret key. Read it from an environment variable —
    # never hardcode it or expose it to the browser.
    secret = ENV['CHATBASE_SECRET']

    # user_id is a string UUID that identifies your user
    OpenSSL::HMAC.hexdigest('sha256', secret, user_id)
  end
  ```
</CodeGroup>

### Identify End Users to Your AI Agent + Update Contact

Once you've generated the end user hash on your server, you can identify the end user to your AI Agent in two ways:

<Tabs>
  <Tab title="Embed script identify method (Recommended)">
    **Dynamically identify end users**

    ```javascript theme={null}
    // After end user logs in or when you have their information
    window.chatbase("identify", {
      user_id: "user-123", 
      user_hash: "generated-hash-from-server",
      user_metadata: {
        "name": "John Doe",
        "email": "john@example.com",
        "company": "Acme Inc" 
      }
    });
    ```
  </Tab>

  <Tab title="Embed Configuration">
    **Set end user identity before the Chatbase script loads**

    ```html theme={null}
    <script>
    // Set end user configuration before Chatbase script loads
    window.chatbaseUserConfig = {
      user_id: "end-user-123",
      user_hash: "generated-hash-from-server", 
      user_metadata: {
        "name": "John Doe",
        "email": "john@example.com", 
        "company": "Acme Inc"
      }
    }
    </script>

    <!-- Your normal Chatbase embed script -->

    ```
  </Tab>
</Tabs>

## Identity Parameters

<ParamField body="user_id" type="string" required>
  Unique identifier for the user from your authentication system. This tells your AI Agent which end user is currently authenticated. You can use 'sub' instead of 'user\_id' and it will work identically.

  **Format:** Any string (UUID recommended)\
  **Example:** `"end-user-12345"`, `"550e8400-e29b-41d4-a716-446655440000"`

  <Note>
    To enable personalized responses and actions, create a Contact record with `external_id` matching this `user_id` using the [Contacts API](/docs/api-reference/contacts/create-contacts-for-a-chatbot).
  </Note>
</ParamField>

<ParamField body="user_hash" type="string" required>
  HMAC-SHA256 hash of the user\_id using your Chatbase secret key. This proves to Chatbase that the end user is authentically logged in. Must be generated on your server for security.

  **Format:** 64-character hexadecimal string\
  **Example:** `"a1b2c3d4e5f6..."`
</ParamField>

<ParamField body="user_metadata" type="object" optional>
  Additional session-specific information about the authenticated end user. This provides context to the AI Agent about the current session.

  **Character limit:** 1000 characters total across all fields\
  **Use for:** Session state, temporary preferences, current page context, authentication level

  <Warning>
    **Do not include confidential information** in user\_metadata such as passwords, social security numbers, credit card details, or other sensitive data. If your AI Agent needs access to confidential user information, store it securely in [Contacts](/docs/user-guides/chatbot/contacts/contacts-overview) instead.
  </Warning>

  ```javascript theme={null}
  user_metadata: {
    "current_session": "mobile_app",
    "last_page_visited": "/dashboard",
    "auth_level": "premium_user",
    "session_preferences": { "theme": "dark" }
  }
  ```
</ParamField>

## Security & Best Practices

<AccordionGroup>
  <Accordion title="Server-Side Hash Generation">
    **Always generate end user hashes on your server**, never in client-side JavaScript:

    ✅ **Secure:** Generate hash in your backend API\
    ✅ **Secure:** Use environment variables for Chatbase secret keys\
    ❌ **Insecure:** Generate hash in browser JavaScript\
    ❌ **Insecure:** Include secret key in client-side code
  </Accordion>

  <Accordion title="End User ID Format">
    **Use consistent, unique end user identifiers:**

    ✅ **Good:** UUIDs (`550e8400-e29b-41d4-a716-446655440000`)\
    ❌ **Avoid:** Emails or usernames that might change
  </Accordion>

  <Accordion title="Metadata Management">
    **Keep end user metadata relevant and concise:**

    ✅ **Include:** Information that helps personalize AI responses\
    ✅ **Include:** Context that aids in customer support\
    ❌ **Avoid:** Sensitive data like passwords or SSNs\
    ❌ **Avoid:** Excessive data that exceeds 1000 character limit
  </Accordion>

  <Accordion title="JWT Security Best Practices">
    **Secure JWT implementation and management:**

    ✅ **Secure:** Generate JWTs on your server with proper expiration times\
    ✅ **Secure:** Use strong, unique secret keys stored in environment variables\
    ✅ **Secure:** Include only necessary user data in JWT payload\
    ✅ **Secure:** Implement proper token refresh mechanisms\
    ❌ **Insecure:** Generate JWTs in client-side JavaScript\
    ❌ **Insecure:** Use excessively long expiration times (keep under 24 hours)
  </Accordion>
</AccordionGroup>

## Troubleshooting

<AccordionGroup>
  <Accordion title="Hash Mismatch Errors">
    **Symptoms:** End user identity not recognized, actions using Contact data fail

    **Solutions:**

    * Verify secret key matches the one from Chatbase Dashboard
    * Ensure user\_id used for hashing exactly matches the one sent
    * Check that hash is generated using HMAC-SHA256
    * Confirm user\_id is a string, not a number
    * Confirm user\_id is the same as the one used in the Contact record

    ```javascript theme={null}
    // ❌ Wrong - user_id as number
    const endUserId = 12345;

    // ✅ Correct - user_id as string  
    const endUserId = "12345";
    ```
  </Accordion>

  <Accordion title="Contact Data Not Available">
    **Symptoms:** End user is verified but Contact data isn't accessible, actions using Contact info fail

    **Solutions:**

    * Verify a Contact exists with `external_id` matching the end user's `user_id`
    * Check Contact was created using Contacts API
    * Ensure `user_id` and Contact `external_id` match exactly (case-sensitive)
    * Confirm Contact has required fields populated (e.g., Stripe accounts for payment actions)
  </Accordion>

  <Accordion title="Identity Not Persisting">
    **Symptoms:** End user identity lost between page loads, Contact data not maintained

    **Solutions:**

    * Use `chatbaseUserConfig` for page-load identification
    * Call `identify()` early in your application lifecycle
    * Ensure end user hash is available before calling identify
    * Check browser console for JavaScript errors
  </Accordion>

  <Accordion title="Metadata vs Contact Data Confusion">
    **Symptoms:** Expected end user information not available to AI Agent

    **Solutions:**

    * Use Contact data for permanent end user information
    * Use `user_metadata` only for session-specific context
    * Reduce metadata size to under 1000 characters
    * Store comprehensive end user data in Contact custom attributes
  </Accordion>
</AccordionGroup>

## Complete User Hash Implementation Flow

This example shows the complete flow: creating Contacts with custom attributes, then using identity verification to enable personalized AI responses.

### Step 1: Create Contact on User Registration/Updates

When users sign up or their data changes, create a Contact record in Chatbase with custom attributes and Stripe customer ID:

```javascript Contact Creation API Call theme={null}
const axios = require('axios');

// When user signs up or data changes
async function createChatbaseContact(userData) {
  const contactData = {
    "users": [
      {
        "external_id": userData.id,           // Your user ID
        "name": userData.name,
        "email": userData.email,
        "phonenumber": userData.phone,
        "stripe_accounts": [
          {
            "label": "Default Account",
            "stripe_id": userData.stripe_customer_id  // Stripe customer ID
          }
        ],
        "custom_attributes": {
          "signup_date": userData.signup_date,
          "support_tier": userData.support_tier
        }
      }
    ]
  };

  // Create contact via Chatbase API
  const response = await axios.post(
    `https://www.chatbase.co/api/v1/chatbot/${process.env.AGENT_ID}/contact`,
    contactData,
    {
      headers: {
        'Authorization': `Bearer ${process.env.CHATBASE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  console.log('Contact created:', response.data);
  return response.data;
}
```

### Step 2: Generate Hash on User Login

When users log in, generate the identity hash on your server:

```javascript Server-Side Hash Generation theme={null}
const crypto = require('crypto');

function generateUserHash(userId, secret) {
  return crypto.createHmac('sha256', secret).update(userId).digest('hex');
}

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Authenticate user with your existing logic
  const user = await authenticateUser(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate secure hash for identity verification
  const userHash = generateUserHash(user.id, process.env.CHATBASE_SECRET);
  
  res.json({
    user: user,
    userHash: userHash  // Send to frontend for identify call
  });
});
```

### Step 3: Identify User in Frontend

Use the hash to identify the user to Chatbase widget:

```javascript Frontend Identity Verification theme={null}
// After successful login
async function loginUser() {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com', password: 'password' })
  });
  
  const { user, userHash } = await response.json();
  
  // Identify user to Chatbase - enables access to Contact data
  window.chatbase("identify", {
    user_id: user.id,
    user_hash: userHash,
    user_metadata: {
      "name": user.name,
      "email": user.email,
      "current_page": "dashboard"
    }
  });
  
  console.log('User identified - AI Agent can now access Contact data and perform Stripe actions');
}
```

### Step 4: Unlock Powerful Custom Actions with Contact Data 🚀

Note: The JWT method allows you to insert and update AI agent contacts without the need for seperate API calls
to the Contacts API.

Now that your AI Agent has access to rich contact data, it can perform incredibly sophisticated custom actions that were previously impossible!

<CardGroup cols={1}>
  <Card title="Custom Actions User Guide" icon="code" href="/docs/user-guides/chatbot/actions/custom-action">
    Learn how to build powerful custom actions that leverage your contact data for personalized user experiences.
  </Card>
</CardGroup>

### Step 5: Unlock Stripe Actions 💳

Here's where the magic really happens! By adding `stripe_accounts` to your contacts, you've just unlocked the full power of our Stripe integration. Your AI Agent can now handle complex billing operations seamlessly without any additional coding on your part.

<Warning>
  **Game Changer Alert**: Your customers can now say things like "Cancel my subscription", "Show me my last invoice", or "Update my payment method" and your AI Agent will handle these requests intelligently with full context about their account!
</Warning>

**What This Means for Your Business:**

* **Reduced Support Tickets**: Common billing questions are handled instantly
* **Improved Customer Experience**: No more "let me transfer you to billing"
* **Increased Efficiency**: One AI Agent handles both support AND billing operations
* **Personalized Service**: Every interaction is tailored to the customer's specific account details

<CardGroup cols={1}>
  <Card title="Stripe Actions" icon="stripe" href="/docs/user-guides/chatbot/actions/stripe-action">
    Learn how to use Stripe actions to handle billing, subscriptions, and invoices.
  </Card>
</CardGroup>

## Next Steps

<CardGroup cols={2}>
  <Card title="Contacts API" icon="users" href="/docs/api-reference/contacts/create-contacts-for-a-chatbot">
    Learn how to create and manage Contact records that link to verified end users
  </Card>

  <Card title="Custom Attributes API" icon="sliders" href="/docs/api-reference/contacts/create-custom-attribute">
    Store additional end user data in Contact custom attributes for personalized experiences
  </Card>

  <Card title="Client-Side Custom Actions" icon="wand-magic-sparkles" href="/docs/developer-guides/client-side-custom-actions">
    Call backend actions from the client side
  </Card>

  <Card title="Client-Side Custom Forms" icon="rectangle-list" href="/docs/developer-guides/client-side-custom-forms">
    Add interactive forms and data collection to your chat
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
# Captifve
Captifve is a custom-built captive portal solution developed for [Hafven GmbH & Co KG](https://www.hafven.de). Users can access the wifi with their user account or vouchers from the café.

## Under the hood
### Technical Flow
1. When a user connects to the WiFi network, they are redirected to the captive portal
2. The user is presented with either a login form or a link to the UniFi Voucher Page
3. Upon submission, the app:
3.1 Authenticates with the CoApp API
3.2 Retrieves the user's membership plan
4. Checks if the plan is in the allowed list
4. If allowed, authorizes the user's device on the UniFi network
5. Redirects to a success page

### What file does what?
- `app.js`:The main file. All the logic bundling together the subprocesses is located in this file.
- `config.js`: Logging, Loading the `config.yaml` and `secrets.yaml`
- `coapp_auth.js`: Authentication with CoApp per Users
- `unifi.js`: Whitelisting client in UniFi Controller
- `config.yaml`: Configuration file (allowed membership plans, ports, etc.)
- `secrets.yaml`: Secrets file (passwords, etc.)

## Diagrams
### Server startup
```mermaid
flowchart TD
    n1["Load configuation and secrets"] --> n2["Start server"]
    n2 --> n3["Connect to UniFi Controller"]
    n3 --> n4["Captive Portal Ready"]
    n1 -- Configuration not found --> n5["Crash"]
    n3 -- Connection not possible --> n5
    n1@{ shape: proc}
    n2@{ shape: proc}
    n3@{ shape: proc}
    n4@{ shape: terminal}
    n5@{ shape: terminal}
```

### Login flowchart
```mermaid
flowchart TD
 subgraph s1["coapp_auth.js"]
        n6["Get user token from CoApp"]
        n7["Get membership plan using token"]
  end
 subgraph s2["unifi.js"]
        n9["Whitelist client in UniFi Controller"]
  end
    n3["Wifi Login"] -- UniFi Controller passes clientMAC, apMAC --> n4["Captive Portal"]
    n4 --> n5["Login"]
    n5 -- Membership --> n6
    n6 --> n7
    n7 --> n8["Check if plan has access"]
    n8 --> n9
    n9 --> n11["Success Page"]
    n5 -- Café --> n12["Forward to UniFi Voucher Page"]
    n3@{ shape: event}
    n5@{ shape: decision}
    n11@{ shape: terminal}
```

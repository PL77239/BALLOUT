# Private online 1v1 (test)

In PLAY, set MODE to ONLINE 1V1 and press START.

1. Host selects the map and score target, then CREATE ROOM.
2. Share the six-character room code privately. Keep the host tab active.
3. Friend opens the same game version, selects ONLINE 1V1 and enters the code under JOIN.
4. Host is P1, guest is P2. Each browser can use a keyboard or controller independently.
5. LEAVE ROOM closes the connection and returns to the menu. Create a new room for another match.

Two active players only. No accounts, public matchmaking, ranked results, campaign rewards or reconnect/resume. Escape does not pause an online match. Latency is shown in the connection strip. If a peer stops sending inputs for 300 ms, held movement/actions clear. A missing peer times out after 10 seconds.

## Hosting

GitHub Pages hosts the normal Vite build. PeerJS is bundled with the game; its public cloud handles signalling. WebRTC carries match data directly between browsers. No game server deployment, port forwarding or repository credentials are required for the default setup. Both browsers must run compatible game versions.

The host runs the existing 240 Hz fixed-step simulation and receives guest inputs. It sends snapshots at up to 30 Hz. The guest interpolates positions and renders host poses, scores and meters. This first version has no client prediction, rollback or lag compensation: remote shot timing and movement depend on round-trip latency. It is intended for private playtests, not ranked fairness. Host advantage is expected.

## Networks that cannot connect

PeerJS Cloud is an external shared service, not a service provided by GitHub Pages. If signalling cannot be reached, the lobby reports the error and allows retry. Direct WebRTC may fail behind restrictive firewalls, symmetric NAT or some mobile networks; those cases need a TURN relay. Using the same Wi-Fi is fine, but does not remove the signalling requirement.

Optional Vite build variables:

```
VITE_PEER_HOST=your-signalling-host.example
VITE_PEER_PORT=443
VITE_PEER_PATH=/
VITE_PEER_SECURE=true
VITE_TURN_URL=turn:your-relay.example:3478
VITE_TURN_USER=temporary-test-user
VITE_TURN_CREDENTIAL=temporary-test-credential
```

Omit all variables to use the PeerJS defaults. Custom signalling must use HTTPS/WSS when the game is on Pages. TURN build variables become public client data; use restricted, expiring test credentials. A production service should issue short-lived credentials at runtime.

## Checks

`node scripts/check-network.cjs` covers input validation, accumulated action edges, stale/reordered packets, P2 input reaching the actual host simulation, and snapshot validation. The existing gameplay checks cover the unchanged physics and progression rules.

`node scripts/check-online-browser.cjs` runs the actual lobby and game scenes in two Chromium pages with a substituted transport. It verifies guest movement reaching host physics, snapshot convergence, a winning score, no campaign reward and disconnect UI. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to an installed Chromium executable if Playwright has no downloaded browser. This verifies integration, not external WebRTC connectivity.

The development environment could complete offer/answer signalling against a local PeerServer, but exposed no ICE candidates to Chromium. An actual connection through two real internet connections remains to be tested after deployment.

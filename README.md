# Shared Vision

A [Foundry VTT](https://foundryvtt.com/) module that provides flexible vision sharing between player tokens.

**Requires:** Foundry VTT v13 | [libWrapper](https://foundryvtt.com/packages/lib-wrapper/)

## Features

- **Global Shared Vision** - A toggle button lets the GM instantly share vision between configured tokens and all players. Great for keeping the whole party engaged during exploration, even when tokens are spread across a map.
- **Per-User Vision Config** - Configure each actor to share vision, token location, or fog exploration with specific players.
- **Permission & Disposition Overrides** - Automatically share vision based on token ownership level (none/limited/observer/owner) or disposition (friendly/neutral/hostile/secret).
- **Combat Automation** - Automatically enable or disable vision sharing when combat starts or ends.

## Usage

### Control Buttons

Two toggle buttons appear in the token controls toolbar (GM only):

- **Enable Global Shared Vision** - Shares vision for all actors that have global sharing enabled in their vision config.
- **Disable All Vision Sharing** - Overrides everything and turns off all sharing.

### Vision Config (Per-Actor)

Right-click an actor in the Actors sidebar and select **Shared Vision** to open the vision config. From here you can:

- Enable the actor for global shared vision
- Allow sharing even when the token is hidden
- Configure per-player settings:
  - **Vision** - Player sees through this token's eyes
  - **Token** - Player sees the token's icon on unexplored areas
  - **Fog** - Player receives this token's fog exploration

### Module Config

Access from the module settings. Configure:

- **Ownership overrides** - Auto-share vision/token/fog by permission level
- **Disposition overrides** - Auto-share by token disposition
- **Combat behavior** - What happens to sharing when combat starts/ends

## How It Works

Shared Vision overrides `Token.prototype._isVisionSource` via [libWrapper](https://foundryvtt.com/packages/lib-wrapper/) to include shared tokens as vision sources. It uses socket communication to synchronize sharing state between GM and player clients.

## Credits

**Original author:** Cristian Deenen (CDeenen)

**Contributors:** muhahahahe, doubledgedboard, Sentientdeth

This is a fork of the [original module](https://github.com/CDeenen/SharedVision), updated for Foundry VTT v13 compatibility.

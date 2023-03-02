# replicator

"Computer, Lights."

Creating an offline on-device Smart-Home voice assistant ecosystem with Node.js and [Picovoice](https://picovoice.ai)

This repo contains the server application. For a client implementation, check out https://github.com/tziegler-tud/replicator-client

## How it works:
This application acts an as voice-interaction interface between several API-exposing smart-home gateways, e.g. Phillips Hue, Deconz or Homeassistant.
The server (this repo) acts as a broker for interaction with these apis. Clients connecting to the server are "satellite" devices providing intent-based speech recognition, and forwarding these resulting intents to the server.
The Server uses several layers of abstraction to provide customizable handling of these intents.

## Core concepts:

### Clients:
Clients connect to the server via tcp/ip. They handle speech recognition on their device, and forward the results to the server for processing.

### Intents:
A shared, pre-defined set of intents to be used by clients and server alike. Currently, we use the .yaml file matching our model obtained using the picovoice console. However, any intent-based speech recognition will do.

### IntentHandlers:
IntentHandler provide the means to customize handling of intents. They contain a set of skills to be executed under the respective context. When the server receives an intent form a client, it selects a matching intentHandler to be executed.

### Skills:
Skills abstract basic server functions into complex instructions, e.g. controlling lights, playing music, requesting STT/Sound output on the client, etc... In general, skills can implement arbitrary functions to be run server-side.

### Integrations
Integrations abstract resources provided via external apis, e.g. Phillips Hue Bridge, a Homeassistant instance or a Volumio Server, into internal resources managed by according services. Integrations take care of translating internal resource state changes to the external apis. For example, a Hue Light and a Zigbee-Light connected via HA are managed internally as the same resource type (light). Thus, we can use the same skill to change both, while the integrations provide the interface to the respective apis.

## Current state:
This project is still in the early stages of development. Basic functionality is implemented for the most part, and more features will be add one after another.


### Features currently implemented or worked at:
- TCP/IP communication between server and clients
- Intents
- Skills
- IntentHandlers
- basic API
- Phillips Hue Integration
- Work in progress: Web-based UI for management 

### planned features:
#### integrations:
- Volumio integration
- Deconz integration
- Homeassistant integration

#### skills:
- Sound output
- TTS output
- Music playback
- Setting timers/alarms

## Tech requirements
- Node.js 16+
- MongoDb 5.0.12 (or any version compatible with the mongoose version used)
- 
### Server Hardware:
Anything capable of running node.js + mongodb should do. I am using a raspberry pi 4 4GB. 

### Client Hardware:
- Raspberry Pi 3 or newer / Raspberry Pi Zero
##### Microphone
Any mic supported by the pi. I am using the ones below, which add the benefit of having some LEDs and still allow access to some GPIOs: 
- [Seedstudio ReSpeaker 4-Mic Array](https://wiki.seeedstudio.com/ReSpeaker_4_Mic_Array_for_Raspberry_Pi/)
- [Seedstudio ReSpeaker 2-Mic Array](https://wiki.seeedstudio.com/ReSpeaker_2_Mics_Pi_HAT/)

## Installation and Quick start:
For a basic installation, it is enough to clone this repo, install the modules (run npm install for both package.json in root dir and package.json in /src dir), and add an empty database to your mongo instance.
Then, you need to set up your configuration using the /config dir:
### Database config:
Check out [exampleConfig](https://github.com/tziegler-tud/replicator/tree/server-rework/exampleConfig)
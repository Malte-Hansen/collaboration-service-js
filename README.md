## Description

Service that enables collaborative features for ExplorViz. The corresponding frontend branch is available [here](https://git.se.informatik.uni-kiel.de/ExplorViz/code/frontend/-/tree/socketio?ref_type=heads).

## Installation

- `git clone <repository-url>` this repository
- `cd collaboration-service-js`
- `npm install`

## Running / Development

- Start local Redis instance: `docker compose -f .dev/compose.yaml up -d`
- Start application: `npm run start`

## Testing

- Start local Redis instance: `docker compose -f .dev/compose.yaml up -d`
- Start application: `npm run start`
- Start tests: `npm run test:supertest`

## Building

- Execute `npm run build`
